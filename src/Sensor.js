require('./common/NamespaceUtils.js');
require('./common/logging/LoggingSystem.js');

assertNamespace('spectroscope');

/**
 * constructor function of a light spectroscope sensor
 * 
 * serialPortPath (e.g. 'com5', '/dev/tty-usbserial1', ...)
 */
spectroscope.Sensor = function Sensor(serialPortPath) {

   const POLLING_INTERVAL_IN_MS = 1000;
   const RESTART_DELAY_IN_MS    = 1000;

   const { SerialPort }      = require('serialport');
   const readlinePromises    = require('node:readline/promises');
   
   var LOGGER = common.logging.LoggingSystem.createLogger('Sensor');
   
   var port;
   var lineReader;
   var pendingPollTask;

   var poll = function poll() {
      pendingPollTask = undefined;

      if (lineReader !== undefined) {
         lineReader.question('hello sensor\n')
            .then(answer => {
               LOGGER.logInfo('answer: ' + answer);
               pendingPollTask = setTimeout(poll, POLLING_INTERVAL_IN_MS);
            })
            .catch(error => LOGGER.logError(error));
      }
   };

   var openConnection = function openConnection() {
      LOGGER.logInfo('opening connection (path=' + serialPortPath + ')');
      var instance = new SerialPort({path: serialPortPath, baudRate: 57600});
      instance.on('open', () => {
         port       = instance;
         lineReader = readlinePromises.createInterface({ input: instance, output: instance });
         poll();
      });
      instance.on('error', message => {
         LOGGER.logError('failed to open connection: ' + message);
         restartConnection();
      });
      instance.on('close', message => {
         LOGGER.logError('received connection close event: ' + message);
         restartConnection();
      });
   };

   var closeConnection = function closeConnection() {
      LOGGER.logInfo('closing connection');
      
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
   };

   var restartConnection = function restartConnection() {
      closeConnection();
      setTimeout(openConnection, RESTART_DELAY_IN_MS);
   };

   openConnection();
};