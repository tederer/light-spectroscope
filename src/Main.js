/* global common, __dirname, process, spectroscope */

require('./common/logging/LoggingSystem.js');
require('./common/webserver/Webserver.js');
require('./common/MainInitializer.js');
require('./common/infrastructure/bus/Bus.js');
require('./common/infrastructure/busbridge/ServerSocketIoBusBridge.js');
require('./SharedTopics.js');
require('./Sensor.js');
require('./StaticWebContent.js');

const DEFAULT_PORT = 80;
const PATH_PREFIX  = '';

const LOGGER = common.logging.LoggingSystem.createLogger('Main');
   
var startup = async function startup() {
   var bus              = new common.infrastructure.bus.Bus();
   var topicsToTransmit = [spectroscope.shared.topics.SENSOR_STATE, spectroscope.shared.topics.SENSOR_VALUES];
      
   const webserverSettings = {
      port:                      process.env.WEBSERVER_PORT ?? DEFAULT_PORT,
      pathPrefix:                PATH_PREFIX, 
      openApiYamlFilenamePath:   __dirname + '/openapi.yaml',
      activateSwagger:           process.env.ACTIVATE_SWAGGER === 'true',
      info:                      common.MainInitializer.initialize(PATH_PREFIX)
   };
   
   var webserver = new common.webserver.Webserver(webserverSettings, app => {
      new spectroscope.StaticWebContent(app, PATH_PREFIX);
   });

   const { Server } = require('socket.io');
   const io         = new Server(webserver.getHttpServer());
   
   new common.infrastructure.busbridge.ServerSocketIoBusBridge(bus, topicsToTransmit, io);
   
   //bus.subscribeToPublication(spectroscope.shared.topics.SENSOR_STATE,  data => LOGGER.logInfo('state=' + JSON.stringify(data)));
   //bus.subscribeToPublication(spectroscope.shared.topics.SENSOR_VALUES, data => LOGGER.logInfo('values=' + JSON.stringify(data)));
   new spectroscope.Sensor('com5', bus);
};

startup();
