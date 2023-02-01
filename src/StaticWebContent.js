/* global assertNamespace, common, spectroscope, process */

require('./common/NamespaceUtils.js');
require('./common/logging/LoggingSystem.js');

assertNamespace('spectroscope');

/**
 * constructor function of the static web content part of the web server which needs 
 * to be placed in a folder called "webroot" (its parent is the project root folder).
 * 
 * app    application instance of express
 * bus    instance of common.infrastructure.bus.Bus
 */
 spectroscope.StaticWebContent = function StaticWebContent(app, PATH_PREFIX, WEB_ROOT_FOLDER) {

   const fs                  = require('fs');
   
   const LOGGER              = common.logging.LoggingSystem.createLogger('StaticWebContent');
   const DEFAULT_INDEX_FILE  = 'index.html';
   
   var sendInternalServerError = function sendInternalServerError(response, text) {
      response.writeHeader(500, {'Content-Type': 'text/plain'});  
      response.write(text);  
      response.end();
   };
   
   var logRequest = function logRequest(request,response, next) {
      LOGGER.logDebug('request for "' + request.url + '" received');
      next();
   };
    
   var replaceSpacesInRequestUrlByEscapeSequence = function replaceSpacesInRequestUrlByEscapeSequence(request,response, next) {
      request.url = request.url.replace(/%20/g, ' ');
      next();
   };
     
   var handleFileRequests = function handleFileRequests(request, response) {
      var requestedDocumentPath = request.path;
      var absolutePathOfRequest = WEB_ROOT_FOLDER + requestedDocumentPath;
      
      LOGGER.logDebug('request (path=' + requestedDocumentPath + ',absolutePath=' + absolutePathOfRequest + ')');
   
      if (absolutePathOfRequest.endsWith('/')) {
         absolutePathOfRequest += DEFAULT_INDEX_FILE;
      } 
      
      if (!fs.existsSync(absolutePathOfRequest)) {  
         LOGGER.logInfo('requested file \"' + requestedDocumentPath + '\" does not exist -> sending internal server error (absolutePathOfRequest=' + absolutePathOfRequest + ')'); 
         sendInternalServerError(response, requestedDocumentPath + ' does not exist');
      } else {
         LOGGER.logDebug('returning ' + absolutePathOfRequest);
         response.sendFile(absolutePathOfRequest);
      }
   };

   app.get(PATH_PREFIX + '/*', replaceSpacesInRequestUrlByEscapeSequence);
   app.get(PATH_PREFIX + '/*', logRequest);
   app.get(PATH_PREFIX + '/*', handleFileRequests );
 };