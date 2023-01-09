/* global spectroscope, assertNamespace, process */

require('./NamespaceUtils.js');
require('./logging/LoggingSystem.js');
require('./Version.js');

assertNamespace('spectroscope');

spectroscope.MainInitializer = {

   initialize: function initialize(pathPrefix) {
      const DEFAULT_LOG_LEVEL = 'INFO';
      const LOGGER            = spectroscope.logging.LoggingSystem.createLogger('MainInitializer');
      const logLevel          = spectroscope.logging.Level[process.env.LOG_LEVEL ?? DEFAULT_LOG_LEVEL];
      const version           = spectroscope.getVersion();
      
      spectroscope.logging.LoggingSystem.setMinLogLevel(logLevel);
      
      const info = {
         version:    (typeof version === 'string') ? version : 'not available',
         pathPrefix: pathPrefix,
         start:      (new Date()).toISOString()
      };
      
      LOGGER.logInfo('version = ' + info.version);
      LOGGER.logInfo('log level = ' + logLevel.description);
      LOGGER.logInfo('pathPrefix = ' + pathPrefix);

      return info;
   }
};