/* global assertNamespace, spectroscope */

require('../NamespaceUtils.js');
require('./Logger.js');
require('./LoggingSystem.js');

assertNamespace('spectroscope.logging');

/**
 * ConsoleLogger writes the log output to the console.
 */
spectroscope.logging.ConsoleLogger = function ConsoleLogger(name, minLogLevel) {
   var MESSAGE_SEPARATOR = ';';
   var logLevel = minLogLevel;

   var formatNumber = function formatNumber(expectedLength, number) {
      var result = number.toString();
      while(result.length < expectedLength) {
         result = '0' + result;
      }
      return result;
   };

   var log = function log(level, messageOrSupplier) {
      if (level.value >= logLevel.value) {
         var timestamp = (new Date()).toISOString();
         var message = typeof messageOrSupplier === 'function' ? messageOrSupplier() : messageOrSupplier;
         console.log([timestamp, level.description, name, message].join(MESSAGE_SEPARATOR));
      }
   };

   this.setMinLogLevel = function setMinLogLevel(minLogLevel) {
      logLevel = minLogLevel;
   };

   this.logDebug = function logDebug(messageOrSupplier) {
      log(spectroscope.logging.Level.DEBUG, messageOrSupplier);
   };
   
   this.logInfo = function logInfo(messageOrSupplier) {
      log(spectroscope.logging.Level.INFO, messageOrSupplier);
   };
   
   this.logWarning = function logWarning(messageOrSupplier) {
      log(spectroscope.logging.Level.WARNING, messageOrSupplier);
   };
   
   this.logError = function logError(messageOrSupplier) {
      log(spectroscope.logging.Level.ERROR, messageOrSupplier);
   };
};

spectroscope.logging.ConsoleLogger.prototype = new spectroscope.logging.Logger();