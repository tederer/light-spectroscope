/* global spectroscope, __dirname, process */

require('./common/logging/LoggingSystem.js');
require('./common/webserver/Webserver.js');
require('./common/MainInitializer.js');

const DEFAULT_PORT = 80;
const PATH_PREFIX  = '';

var startup = async function startup() {
   const webserverSettings = {
      port:                      process.env.WEBSERVER_PORT ?? DEFAULT_PORT,
      pathPrefix:                PATH_PREFIX, 
      openApiYamlFilenamePath:   __dirname + '/openapi.yaml',
      activateSwagger:           process.env.ACTIVATE_SWAGGER === 'true',
      info:                      spectroscope.MainInitializer.initialize(PATH_PREFIX)
   };
   
   spectroscope.webserver.Webserver(webserverSettings, app => {});
};

startup();
