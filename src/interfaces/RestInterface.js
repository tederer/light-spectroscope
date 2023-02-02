/* global assertNamespace, common, spectroscope */

require('../common/NamespaceUtils.js');
require('../common/logging/LoggingSystem.js');
require('../SharedTopics.js');
require('../SensorValuesValidator.js');

assertNamespace('spectroscope');

/**
 * constructor function of the Prometheus interface.
 * 
 * bus               instance of common.infrastructure.bus.Bus
 */
spectroscope.RestInterface = function RestInterface(app, PATH_PREFIX, bus) {

   const LOGGER                = common.logging.LoggingSystem.createLogger('RestInterface');
   const VALIDATOR             = new spectroscope.SensorValuesValidator();
   const containsAllData       = VALIDATOR.containsAllData;
   const containsTimestampOnly = VALIDATOR.containsTimestampOnly;
   
   var calibratedSensorValues;
   var rawSensorValues;

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
      if (containsTimestampOnly(values) && !containsAllData(values)) {
         calibratedSensorValues = undefined;
         rawSensorValues        = undefined;
         return;
      }

      if (containsAllData(values)) {
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