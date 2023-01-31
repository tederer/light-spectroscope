/* global assertNamespace, common, spectroscope, setTimeout, clearTimeout */

require('./common/NamespaceUtils.js');
require('./common/logging/LoggingSystem.js');
require('./SharedTopics.js');

assertNamespace('spectroscope');

/**
 * constructor function of the Prometheus interface.
 * 
 * bus               instance of common.infrastructure.bus.Bus
 */
spectroscope.PrometheusInterface = function PrometheusInterface(app, PATH_PREFIX, bus) {

   const METRIC_PATH       = '/metrics';
   const METRIC_NAME       = 'light_spectrum_total';
   const WAVELENGTH_LABEL  = 'wavelength';
   const DATATYPE_LABEL    = 'type';
   const DATATYPES         = ['calibrated', 'raw'];

   var LOGGER = common.logging.LoggingSystem.createLogger('PrometheusInterface');
   
   var responseContent;

   var nowInMs = function nowInMs() {
      return Date.now();
   };

   var validSensorValues = function validSensorValues(values) {
      return   (typeof values                   === 'object') &&
               (typeof values.timestamp         === 'number') &&
               (typeof values.rawValues         === 'object') &&
               (typeof values.calibratedValues  === 'object') &&
               (typeof values.temperatures      === 'object') &&
               (values.rawValues.length         === values.calibratedValues.length);
   };

   var getWaveLengthNames = function getWaveLengthNames(values) {
      return Object.keys(values.rawValues.values).sort();
   };

   var sendCurrentSensorValues = function sendCurrentSensorValues(request, response) {
      if (responseContent !== undefined) {
         response.status(200).type('text/plain; version=0.0.4').send(responseContent);
      } else {
         response.status(404);
      }
   };

   var createMetric = function createMetric(waveLengthName, type, value, timestamp) {
      var result  = '# TYPE ' + METRIC_NAME + ' gauge\n';
      result      += METRIC_NAME + '{' + DATATYPE_LABEL + '="' + type + '",' + 
                     WAVELENGTH_LABEL + '="' + waveLengthName + '"} ' + value + ' ' + timestamp + '\n';
      return result;
   };

   var onSensorValuesReceived = function onSensorValuesReceived(values) {
      if (validSensorValues(values)) {
         responseContent = '';
         var timestamp   = nowInMs();

         DATATYPES.forEach((type, index) => {
            getWaveLengthNames(values).forEach(waveLengthName => {
               var value = values[type + 'Values'].values[waveLengthName];
               responseContent += createMetric(waveLengthName, type, value, timestamp);
            });
            if (index === 0) {
               responseContent += '\n';
            }
         });
      } else {
         responseContent = undefined;
         LOGGER.logError('received invalid sensor values: ' + JSON.stringify(values));
      }
   };

   var path = PATH_PREFIX + METRIC_PATH;
   app.get(path, sendCurrentSensorValues);

   LOGGER.logInfo('metrics are available at ' + path);

   bus.subscribeToPublication(spectroscope.shared.topics.SENSOR_VALUES, onSensorValuesReceived);
};