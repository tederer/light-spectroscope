/* global assertNamespace, common, spectroscope, setTimeout, clearTimeout */

require('./common/NamespaceUtils.js');
require('./common/logging/LoggingSystem.js');
require('./SharedTopics.js');

assertNamespace('spectroscope');

/**
 * constructor function of a light spectroscope sensor
 * 
 * serialPortPath (e.g. 'com5', '/dev/tty-usbserial1', ...)
 */
spectroscope.Sensor = function Sensor(serialPortPath, bus) {

   const POLLING_INTERVAL_IN_MS  = 1000;
   const RESTART_DELAY_IN_MS     = 1000;
   const COMMAND_TIMEOUT_IN_MS   = 1000;
   const BAUDRATE                = 115200;

   const ENTIRE_LINE             = 0;

   const WAVELENGTHS             =  {  description: 'wave lengths',
                                       mapping: [  {sourceIndex: 12, name: '410nm'},
                                                   {sourceIndex: 13, name: '435nm'},
                                                   {sourceIndex: 14, name: '460nm'},
                                                   {sourceIndex: 15, name: '485nm'},
                                                   {sourceIndex: 16, name: '510nm'},
                                                   {sourceIndex: 17, name: '535nm'},
                                                   {sourceIndex:  6, name: '560nm'},
                                                   {sourceIndex:  7, name: '585nm'},
                                                   {sourceIndex:  0, name: '610nm'},
                                                   {sourceIndex:  8, name: '645nm'},
                                                   {sourceIndex:  1, name: '680nm'},
                                                   {sourceIndex:  9, name: '705nm'},
                                                   {sourceIndex:  2, name: '730nm'},
                                                   {sourceIndex:  3, name: '760nm'},
                                                   {sourceIndex:  4, name: '810nm'},
                                                   {sourceIndex:  5, name: '860nm'},
                                                   {sourceIndex: 10, name: '900nm'},
                                                   {sourceIndex: 11, name: '940nm'}]
                                    };

   const SENSOR_DEVICES          =  {  description: 'sensor devices',
                                       mapping: [  {sourceIndex: 0, name: 'AS72651'},
                                                   {sourceIndex: 1, name: 'AS72652'},
                                                   {sourceIndex: 2, name: 'AS72653'}]
                                    };
   
   const { SerialPort }         = require('serialport');
   const readlinePromises       = require('node:readline/promises');
   
   var LOGGER = common.logging.LoggingSystem.createLogger('Sensor');
   
   var port;
   var lineReader;
   var pendingPollTask;
   var firstPoll = true;

   var nowInMs = function nowInMs() {
      return Date.now();
   };

   var publishSensorState = function publishSensorState(softwareVersion, hardwareVersion) {
      var data = (softwareVersion === undefined) ? {} : {
         versions: {
            software: softwareVersion, 
            hardware: hardwareVersion
         }
      };
      bus.publish(spectroscope.shared.topics.SENSOR_STATE, data);
   };

   var publishEmptySensorState = function publishEmptySensorState() {
      publishSensorState();
   };

   var mapValues = function mapValues(rawValues) {
      return mapCommaSeparatedValues(rawValues, WAVELENGTHS, 'µW/cm²');
   };

   var mapTemperatures = function mapTemperatures(temperatures) {
      return mapCommaSeparatedValues(temperatures, SENSOR_DEVICES, '°C');
   };

   var mapCommaSeparatedValues = function mapCommaSeparatedValues(commaSeparatedValues, format, unit) {
      const separator = '|';
      var result = {unit: unit, values: {}};
      var values = commaSeparatedValues.replace(/,\s*/g, separator).split(separator);

      if (values.length !== format.mapping.length) {
         throw 'cannot map ' + format.description + ' because number of values (' + values.length + ') is not ' + format.mapping.length;
      }

      format.mapping.forEach(mapping => result.values[mapping.name] = Number.parseFloat(values[mapping.sourceIndex]));
      
      return result;
   };

   var publishValues = function publishValues(rawValues, calibratedValues, temperatures, timestamp) {
      var data = {
         timestamp:        timestamp, 
         rawValues:        mapValues(rawValues), 
         calibratedValues: mapValues(calibratedValues), 
         temperatures:     mapTemperatures(temperatures)
      };
      bus.publish(spectroscope.shared.topics.SENSOR_VALUES, data);
   };

   var timeout = async function timeout() {
      return new Promise((_, reject) => {
         setTimeout(() => reject('timed out'), COMMAND_TIMEOUT_IN_MS);
      });
   };

   var sendCommand = async function sendCommand(command) {
      try {
         var question         = lineReader.question(command + '\n');
         var response         = await Promise.race([timeout(), question]);
         var trimmedResponse  = (response ?? '').trim();

         LOGGER.logDebug('response = "' + response + '"');
         if (trimmedResponse.toUpperCase().endsWith('OK')) {
            return trimmedResponse.substring(0, trimmedResponse.length - 'OK'.length).trim();
         } else {
            throw 'unexpected response "' + response + '"';
         }
      } catch(error) {
         throw error;
      }
   };

   var pollData = async function pollData() {
      pendingPollTask = undefined;
      
      if (lineReader !== undefined) {
         var startInMs = nowInMs();
      
         try {
            if (firstPoll) {
               firstPoll           = false;
               var softwareVersion = await sendCommand('ATVERSW');
               var hardwareVersion = await sendCommand('ATVERHW');
               publishSensorState(softwareVersion, hardwareVersion);
            }

            var rawValues        = await sendCommand('ATDATA');
            var calibratedValues = await sendCommand('ATCDATA');
            var temperatures     = await sendCommand('ATTEMP');
            console.log(await sendCommand('ATINTTIME'));
            publishValues(rawValues, calibratedValues, temperatures, startInMs);
         } catch(error) {
            LOGGER.logError('failed to poll values: ' + error);
            // TODO disconnect
         }

         var sleepDurationInMs = Math.max(0, POLLING_INTERVAL_IN_MS - (nowInMs() - startInMs));
         pendingPollTask       = setTimeout(pollData, sleepDurationInMs);
      }
   };

   var initializeConnection = async function initializeConnection() {
      var initialized = false;
      var retries     = 5;
      var lastError;

      LOGGER.logInfo('initializing connection');

      lineReader.clearLine(ENTIRE_LINE);
      
      while (!initialized && (retries > 0)) {
         var command = 'AT';
         try {
            await sendCommand(command);
            initialized = true;
         } catch(error) {
            lastError = 'failed to send "' + command + '": ' + error;
         }
         retries--;
      }

      if (!initialized) {
         throw lastError;
      }
   };

   var closeConnection = function closeConnection() {
      LOGGER.logInfo('closing connection');
      
      publishEmptySensorState();

      if (pendingPollTask !== undefined) {
         var pendingPollTaskToClear = pendingPollTask;
         pendingPollTask            = undefined;
         clearTimeout(pendingPollTaskToClear);
      }

      if (lineReader !== undefined) {
         var lineReaderToClose = lineReader;
         lineReader            = undefined;
         port                  = undefined;
         lineReaderToClose.close();
      }

      firstPoll = true;
   };

   var restartConnection = function restartConnection() {
      closeConnection();
      setTimeout(openConnection, RESTART_DELAY_IN_MS);
   };

   var openConnection = function openConnection() { // jshint ignore:line
      LOGGER.logInfo('opening connection (path=' + serialPortPath + ')');
      
      var serialPort = new SerialPort({path: serialPortPath, baudRate: BAUDRATE});
      
      serialPort.on('open', async () => {
         LOGGER.logInfo('connection opened');
         port       = serialPort;
         lineReader = readlinePromises.createInterface({ input: serialPort, output: serialPort });
         try {
            await initializeConnection();
            LOGGER.logInfo('initialized connection');
            pollData();
         } catch(error) {
            LOGGER.logError('failed to initialize connection: ' + error);
         }
      });
      
      serialPort.on('error', message => {
         LOGGER.logError('failed to open connection: ' + message);
         restartConnection();
      });
      
      serialPort.on('close', message => {
         LOGGER.logError('received connection close event: ' + message);
         restartConnection();
      });
   };

   openConnection();
};