/* global assertNamespace, common, setTimeout, spectroscope, AbortSignal, __dirname */

require('./common/NamespaceUtils.js');
require('./common/logging/LoggingSystem.js');
require('./SharedTopics.js');
require('./MessageRecorder.js');

assertNamespace('spectroscope');

/**
 * constructor function of a serial light spectroscope sensor connection. Call open() before using it. 
 * In case of problems the connection gets restarted automatically and the listeners for 
 * onConnectionOpened and onConnectionClosed get informed.
 * 
 * The current state gets published on the bus using the topic spectroscope.shared.topics.SENSOR_STATE.
 * 
 * serialPortPath    (e.g. 'com5', '/dev/tty-usbserial1', ...)
 * bus               instance of common.infrastructure.bus.Bus
 */
spectroscope.SensorConnection = function SensorConnection(serialPortPath, bus) {

   const RESTART_DELAY_IN_MS    = 1000;
   const COMMAND_TIMEOUT_IN_MS  = 1000;
   const BAUDRATE               = 115200;
   const LOGGER                 = common.logging.LoggingSystem.createLogger('SensorConnection');
   const RECORDER               = new spectroscope.MessageRecorder();

   const { SerialPort }         = require('serialport');
   const readlinePromises       = require('node:readline/promises');
   const fs                     = require('fs');

   
   var lineReader;
   var openedCallback;
   var closedCallback;
   var thisInstance   = this;
   var lastPublishedState;
   var serviceVersion;

   this.sendCommand = async function sendCommand(command) {
      if (lineReader === undefined) {
         throw 'cannot send command "' + command + '": lineReader is undefined';
      }

      RECORDER.clear();

      try {
         RECORDER.addOutput(command);
         var response = await lineReader.question(command + '\n', {signal: AbortSignal.timeout(COMMAND_TIMEOUT_IN_MS)});
         RECORDER.addInput(response);
         
         var trimmedResponse = (response ?? '').trim();

         if (trimmedResponse.toUpperCase().endsWith('OK')) {
            return trimmedResponse.substring(0, trimmedResponse.length - 'OK'.length).trim();
         } else {
            throw 'unexpected response' + RECORDER.getMessages();
         }
      } catch(error) {
         throw error;
      }
   };

   var publishState = function publishState(state) {
      var stringifiedState = JSON.stringify(state);
      if (lastPublishedState !== stringifiedState) {
         bus.publish(spectroscope.shared.topics.SENSOR_STATE, state);
         lastPublishedState = stringifiedState;
      }
   };

   var publishConnectedState = async function publishConnectedState() {
      var softwareVersion = await thisInstance.sendCommand('ATVERSW');
      var hardwareVersion = await thisInstance.sendCommand('ATVERHW');
      
      publishState({
         versions: {
            software: softwareVersion, 
            hardware: hardwareVersion,
            service:  serviceVersion
         },
         connected: true
      });
   };

   var publishDisconnectedState = function publishDisconnectedState() {
      publishState({ connected: false });
   };

   var readLinesTillTimeout = async function readLinesTillTimeout() {
      var lineRead = true;
      
      RECORDER.clear();
      
      while(lineRead) {
         try {
            var line = await lineReader.question('', {signal: AbortSignal.timeout(COMMAND_TIMEOUT_IN_MS)});
            RECORDER.addInput(line);
         } catch(error) {
            lineRead = false;
         }
      }

      RECORDER.logMessages(LOGGER, 'discarded pending input lines');
   };

   var initialize = async function initialize() {
      var initialized = false;
      var retries     = 5;
      var lastError;

      LOGGER.logInfo('initializing connection');

      await readLinesTillTimeout();  
      
      while (!initialized && (retries > 0)) {
         var command = 'AT';
         try {
            await thisInstance.sendCommand(command);
            initialized = true;
         } catch(error) {
            lastError = error;
         }
         retries--;
      }

      if (!initialized) {
         throw lastError;
      }
   };

   var invokeCallbackIfExists = function invokeCallbackIfExists(callback) {
      if (typeof callback === 'function') {
         callback();
      }
   };

   this.restart = function restart() {
      LOGGER.logInfo('restarting connection');
      if (lineReader !== undefined) {
         var lineReaderToClose = lineReader;
         lineReader            = undefined;
         LOGGER.logInfo('closing line reader');
         lineReaderToClose.close();
      }

      invokeCallbackIfExists(closedCallback);
      publishDisconnectedState();
      LOGGER.logInfo('scheduling connection reopening in ' + RESTART_DELAY_IN_MS + ' ms');
      setTimeout(thisInstance.open, RESTART_DELAY_IN_MS);   
   };

   this.open = function open() { // jshint ignore:line
      LOGGER.logInfo('opening connection (path=' + serialPortPath + ')');
      
      var serialPort = new SerialPort({path: serialPortPath, baudRate: BAUDRATE});
      
      serialPort.on('open', async () => {
         LOGGER.logInfo('connection opened');
         lineReader = readlinePromises.createInterface({ input: serialPort, output: serialPort });
         
         try {
            await initialize();
            LOGGER.logInfo('initialized connection');
            await publishConnectedState();
            invokeCallbackIfExists(openedCallback);
         } catch(error) {
            LOGGER.logError('failed to initialize connection: ' + error);
            thisInstance.restart();
         }
      });
      
      serialPort.on('error', message => {
         LOGGER.logError('received error event: ' + message);
         thisInstance.restart();
      });
      
      serialPort.on('close', message => {
         LOGGER.logError('received close event: ' + message);
         thisInstance.restart();
      });
   };

   this.onConnectionOpened = function onConnectionOpened(callback) {
      openedCallback = callback;
   };

   this.onConnectionClosed = function onConnectionClosed(callback) {
      closedCallback = callback;
   };

   try {
      var fileContent = fs.readFileSync(__dirname + '/../package.json', 'utf8');
      var packageJson = JSON.parse(fileContent);
      serviceVersion  = packageJson.version;
   } catch(e) {
      throw 'failed to evaluate service version: ' + e;
   }

   publishDisconnectedState();
};