/* global common, __dirname, process, spectroscope */

require('./common/webserver/Webserver.js');
require('./common/MainInitializer.js');
require('./common/infrastructure/bus/Bus.js');
require('./common/infrastructure/busbridge/ServerSocketIoBusBridge.js');
require('./SharedTopics.js');
require('./Sensor.js');
require('./StaticWebContent.js');
require('./interfaces/PrometheusInterface.js');
require('./interfaces/RestInterface.js');

var startup = async function startup() {

   const DEFAULT_PORT = 80;
   const PATH_PREFIX  = '';
   
   const path             = require('node:path');
   const bus              = new common.infrastructure.bus.Bus();
   const topicsToTransmit = [spectroscope.shared.topics.SENSOR_STATE, spectroscope.shared.topics.SENSOR_VALUES];
   const WEB_ROOT_FOLDER  = path.resolve(path.dirname(process.argv[1]), '..') + '/webroot';
   
   const webserverSettings = {
      port:                      process.env.WEBSERVER_PORT ?? DEFAULT_PORT,
      pathPrefix:                PATH_PREFIX, 
      openApiYamlFilenamePath:   __dirname + '/openapi.yaml',
      activateSwagger:           true,
      info:                      common.MainInitializer.initialize(PATH_PREFIX)
   };
   
   var webserver = new common.webserver.Webserver(webserverSettings, app => {
      new spectroscope.PrometheusInterface(app, PATH_PREFIX, bus);
      new spectroscope.RestInterface(app, PATH_PREFIX, bus);
      new spectroscope.StaticWebContent(app, PATH_PREFIX, WEB_ROOT_FOLDER);
   });

   const { Server } = require('socket.io');
   const io         = new Server(webserver.getHttpServer());
   
   new common.infrastructure.busbridge.ServerSocketIoBusBridge(bus, topicsToTransmit, io);
   
   new spectroscope.Sensor('com5', bus);
};

startup();
