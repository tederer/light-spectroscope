/* global assertNamespace, common, process, __dirname */

require('../logging/LoggingSystem.js');
require('../NamespaceUtils.js');
require('../Version.js');

assertNamespace('common.webserver');

/**
 * constructor function of a webserver
 * 
 * settings                an object containing ... 
 *                            * [integer] port
 *                            * [boolean] activateSwagger
 *                            * [string]  pathPrefix
 *                            * [string]  openApiYamlFilenamePath 
 *                            * [object]  info (to return when requesting /<pathPrefix>/info)
 * 
 * initializationFunction  this function gets called before the webserver starts listening 
 *                         and it receiving the Express app object
 */
common.webserver.Webserver = function Webserver(settings, initializationFunction) {

   const LOGGER                  = common.logging.LoggingSystem.createLogger('Webserver');
   
   var express                   = require('express');
   var bodyParser                = require('body-parser');
   var pathToSwaggerUi           = require('swagger-ui-dist').absolutePath();
   var fs                        = require('fs');

   var swaggerClientInitScript   = 'swagger-initializer.js';
   var openApiYamlFilename       = 'openapi.yaml';
   var app                       = express();
   var openApiYamlUrlPath        = settings.pathPrefix + '/' + openApiYamlFilename;
   var swaggerInitScriptPath     = __dirname + '/' + swaggerClientInitScript;
   var swaggerInitScriptContent;
   var httpServer;

   try {
      swaggerInitScriptContent = fs.readFileSync(swaggerInitScriptPath, 'utf8').replace('${url}', openApiYamlUrlPath);
   } catch(e) {
      LOGGER.logError('failed to read content of ' + swaggerInitScriptPath + ': ' + e);
   }

   var logGetRequest = function logGetRequest(path) {
      LOGGER.logDebug('GET request [path: ' + path + ']');
   };
   
   app.use(bodyParser.json({ type: 'application/json' })); // makes JSON data (sent in HTTP header) available in request.body

   app.get(settings.pathPrefix + '/info', (request, response) => {
      var path = request.path;
      logGetRequest(path);
      response.status(200).json(settings.info);
   });

   if (settings.activateSwagger) {
      LOGGER.logInfo('swagger UI available at ' + settings.pathPrefix + '/swagger');
      
      app.get(openApiYamlUrlPath, (request, response) => {
         var path = request.path;
         logGetRequest(path);
         response.status(200).sendFile(settings.openApiYamlFilenamePath);
      });

      app.get(settings.pathPrefix + '/swagger/' + swaggerClientInitScript, (request, response) => {
         var path = request.path;
         logGetRequest(path);
         if (swaggerInitScriptContent) {
            response.status(200).type('application/javascript').send(swaggerInitScriptContent);
         } else {
            response.status(500);
         }
      });

      app.use(settings.pathPrefix + '/swagger', express.static(pathToSwaggerUi));
   }

   initializationFunction(app);
   
   httpServer = app.listen(settings.port, () => {
      LOGGER.logInfo('web server listening on port ' + settings.port);
   });

   this.getHttpServer = function getHttpServer() {
      return httpServer;
   };
};