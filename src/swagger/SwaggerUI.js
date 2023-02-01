
/* global assertNamespace, common, spectroscope, __dirname */

require('../common/NamespaceUtils.js');
require('../common/logging/LoggingSystem.js');

assertNamespace('spectroscope');

/**
 * constructor function of the Prometheus interface.
 * 
 * bus               instance of common.infrastructure.bus.Bus
 */
spectroscope.SwaggerUI = function SwaggerUI(app, PATH_PREFIX, WEB_ROOT_FOLDER) {

   var LOGGER                    = common.logging.LoggingSystem.createLogger('SwaggerUI');
   
   var pathToSwaggerUi           = require('swagger-ui-dist').absolutePath(); 
   var express                   = require('express');
   var fs                        = require('fs');

   var swaggerClientInitScript   = 'swagger-initializer.js';
   var openApiYamlFilename       = 'openapi.yaml';

   var openApiYamlUrlPath        = PATH_PREFIX + '/' + openApiYamlFilename;
   var swaggerInitScriptPath     = __dirname   + '/' + swaggerClientInitScript;
   var swaggerInitScriptContent;

   try {
      swaggerInitScriptContent = fs.readFileSync(swaggerInitScriptPath, 'utf8').replace('${url}', openApiYamlUrlPath);
   } catch(e) {
      LOGGER.logError('failed to read content of ' + swaggerInitScriptPath + ': ' + e);
   }

   var logGetRequest = function logGetRequest(path) {
      LOGGER.logDebug('GET request [path: ' + path + ']');
   };
   
   app.get(openApiYamlUrlPath, (request, response) => {
      var path = request.path;
      logGetRequest(path);
      response.status(200).sendFile(WEB_ROOT_FOLDER + '/' + openApiYamlFilename);
   });

   app.get(PATH_PREFIX + '/swagger/' + swaggerClientInitScript, (request, response) => {
      var path = request.path;
      logGetRequest(path);
      if (swaggerInitScriptContent) {
         response.status(200).type('application/javascript').send(swaggerInitScriptContent);
      } else {
         response.status(500);
      }
   });

   app.use(PATH_PREFIX + '/swagger', express.static(pathToSwaggerUi));

   LOGGER.logInfo('swagger UI available at ' + PATH_PREFIX + '/swagger');
};
