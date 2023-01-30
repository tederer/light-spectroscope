/* global assertNamespace, common, setTimeout, spectroscope, AbortSignal */

require('./common/NamespaceUtils.js');
require('./common/logging/LoggingSystem.js');
require('./SharedTopics.js');

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

   const RESTART_DELAY_IN_MS     = 1000;
   const COMMAND_TIMEOUT_IN_MS   = 1000;
   const BAUDRATE                = 115200;

   const ENTIRE_LINE             = 0;

   const { SerialPort }         = require('serialport');
   const readlinePromises       = require('node:readline/promises');
   
   var LOGGER = common.logging.LoggingSystem.createLogger('SensorConnection');
   
   var lineReader;
   var openedCallback;
   var closedCallback;
   var thisInstance   = this;
   var lastPublishedState;

   this.sendCommand = async function sendCommand(command) {
      if (lineReader === undefined) {
         throw 'cannot send command "' + command + '": lineReader is undefined';
      }

      try {
         LOGGER.logDebug('sending: ' + command);
         var response         = await lineReader.question(command + '\n', {signal: AbortSignal.timeout(COMMAND_TIMEOUT_IN_MS)});
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
            hardware: hardwareVersion
         },
         connected: true
      });
   };

   var publishDisconnectedState = function publishDisconnectedState() {
      publishState({ connected: false });
   };

   var readLinesTillTimeout = async function readLinesTillTimeout() {
      var lineRead = true;
      
      while(lineRead) {
         try {
            await lineReader.question('', {signal: AbortSignal.timeout(COMMAND_TIMEOUT_IN_MS)});
         } catch(error) {
            lineRead = false;
         }
      }
   };

   var initialize = async function initialize() {
      var initialized = false;
      var retries     = 5;
      var lastError;

      LOGGER.logInfo('initializing connection');
      await readLinesTillTimeout();       
      LOGGER.logInfo('discarded all pending input lines');
      
      while (!initialized && (retries > 0)) {
         var command = 'AT';
         try {
            await thisInstance.sendCommand(command);
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

   publishDisconnectedState();
};