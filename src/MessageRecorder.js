/* global assertNamespace, common, spectroscope */

require('./common/NamespaceUtils.js');

assertNamespace('spectroscope');

/**
 * Constructor function of a recorder for messages. It can get used to 
 * capture messages for later use (e.g. logging).
 */
spectroscope.MessageRecorder = function MessageRecorder() {
   var messages     = [];
   var thisInstance = this;

   this.clear = function clear() {
      messages = [];
   };

   this.addInput = function addInput(inputMessage) {
      messages.push('in: "' + inputMessage + '"');
   };

   this.addOutput = function addOutput(outputMessage) {
      messages.push('out: "' + outputMessage + '"');
   };

   this.getMessages = function getMessages() {
      return ' (messages: ' + messages.join(',') + ')';
   };

   this.logMessages = function logMessages(logger, description) {
      if (messages.length > 0) {
         logger.logInfo(description + thisInstance.getMessages());
      }
   };
};