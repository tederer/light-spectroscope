/* global common, __dirname, process, spectroscope */

require('./common/logging/LoggingSystem.js');
require('./common/webserver/Webserver.js');
require('./common/MainInitializer.js');
require('./common/infrastructure/bus/Bus.js');
require('./common/infrastructure/busbridge/ServerSocketIoBusBridge.js');
require('./common/logging/LoggingSystem.js');
require('./SharedTopics.js');
require('./Sensor.js');

var app = require('express')();

const DEFAULT_PORT = 80;
const PATH_PREFIX  = '';

const LOGGER = common.logging.LoggingSystem.createLogger('Main');
   
var startup = async function startup() {
   var bus              = new common.infrastructure.bus.Bus();
   var topicsToTransmit = [];
      
   const webserverSettings = {
      port:                      process.env.WEBSERVER_PORT ?? DEFAULT_PORT,
      pathPrefix:                PATH_PREFIX, 
      openApiYamlFilenamePath:   __dirname + '/openapi.yaml',
      activateSwagger:           process.env.ACTIVATE_SWAGGER === 'true',
      info:                      common.MainInitializer.initialize(PATH_PREFIX)
   };
   
   common.webserver.Webserver(webserverSettings, app => {
      var server     = require('http').Server(app);
      var io         = require('socket.io')(server);
      var busBridge  = new common.infrastructure.busbridge.ServerSocketIoBusBridge(bus, topicsToTransmit, io);
   });

   bus.subscribeToPublication(spectroscope.shared.topics.SENSOR_STATE,  data => LOGGER.logInfo(JSON.stringify(data)));
   bus.subscribeToPublication(spectroscope.shared.topics.SENSOR_VALUES, data => LOGGER.logInfo(JSON.stringify(data)));
   new spectroscope.Sensor('com5', bus);
};

startup();
