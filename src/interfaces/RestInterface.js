/* global assertNamespace, common, spectroscope */

require('../common/NamespaceUtils.js');
require('../common/logging/LoggingSystem.js');
require('../SharedTopics.js');

assertNamespace('spectroscope');

/**
 * constructor function of the Prometheus interface.
 * 
 * bus               instance of common.infrastructure.bus.Bus
 */
spectroscope.RestInterface = function RestInterface(app, PATH_PREFIX, bus) {

   var LOGGER = common.logging.LoggingSystem.createLogger('RestInterface');
   
   var calibratedSensorValues;
   var rawSensorValues;

   var validSensorValues = function validSensorValues(values) {
      return   (typeof values                   === 'object') &&
               (typeof values.timestamp         === 'number') &&
               (typeof values.rawValues         === 'object') &&
               (typeof values.calibratedValues  === 'object') &&
               (typeof values.temperatures      === 'object') &&
               (values.rawValues.length         === values.calibratedValues.length);
   };

   var sendCalibratedSensorValues = function sendCalibratedSensorValues(request, response) {
      if (calibratedSensorValues !== undefined) {
         response.status(200).type('application/json').send(calibratedSensorValues);
      } else {
         response.status(404);
      }
   };

   var sendRawSensorValues = function sendRawSensorValues(request, response) {
      if (rawSensorValues !== undefined) {
         response.status(200).type('application/json').send(rawSensorValues);
      } else {
         response.status(404);
      }
   };

   var extractValues = function extractValues(values, dataType) {
      var result = { timestamp: values.timestamp, values: {} };
      var keys   = Object.keys(values[dataType].values);
      
      keys.forEach(key => result.values[key] = values[dataType].values[key]);

      return result;
   };

   var onSensorValuesReceived = function onSensorValuesReceived(values) {
      if (validSensorValues(values)) {
         calibratedSensorValues = extractValues(values, 'calibratedValues');
         rawSensorValues        = extractValues(values, 'rawValues');
      } else {
         calibratedSensorValues = undefined;
         rawSensorValues        = undefined;
         LOGGER.logError('received invalid sensor values: ' + JSON.stringify(values));
      }
   };

   app.get(PATH_PREFIX + '/api/sensorvalues/calibrated', sendCalibratedSensorValues);
   app.get(PATH_PREFIX + '/api/sensorvalues/raw', sendRawSensorValues);
   
   bus.subscribeToPublication(spectroscope.shared.topics.SENSOR_VALUES, onSensorValuesReceived);
};