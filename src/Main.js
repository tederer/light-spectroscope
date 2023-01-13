/* global common, __dirname, process */

require('./common/logging/LoggingSystem.js');
require('./common/webserver/Webserver.js');
require('./common/MainInitializer.js');
require('./common/infrastructure/bus/Bus.js');
require('./common/infrastructure/busbridge/ServerSocketIoBusBridge.js');

var app = require('express')();

const DEFAULT_PORT = 80;
const PATH_PREFIX  = '';

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
};

startup();
