/* global assertNamespace, common, spectroscope */

require('../common/NamespaceUtils.js');
require('../common/logging/LoggingSystem.js');
require('../SharedTopics.js');
require('../SensorValuesValidator.js');
require('../SensorStateValidator.js');

assertNamespace('spectroscope');

/**
 * constructor function of the Prometheus interface.
 * 
 * bus               instance of common.infrastructure.bus.Bus
 */
spectroscope.RestInterface = function RestInterface(app, PATH_PREFIX, bus) {

   const LOGGER                      = common.logging.LoggingSystem.createLogger('RestInterface');
   const VALIDATOR                   = new spectroscope.SensorValuesValidator();
   const valuesContainsAllData       = VALIDATOR.containsAllData;
   const valuesContainsTimestampOnly = VALIDATOR.containsTimestampOnly;
   const stateContainsAllData        = (new spectroscope.SensorStateValidator()).containsAllData;
   
   var calibratedSensorValues;
   var rawSensorValues;
   var sensorVersions;
   var sensorTemperatures;

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

   var sendSensorTemperatures = function sendSensorTemperatures(request, response) {
      if (sensorTemperatures !== undefined) {
         response.status(200).type('application/json').send(sensorTemperatures);
      } else {
         response.status(404);
      }
   };

   var sendSensorVersions = function sendSensorVersions(request, response) {
      if (sensorVersions !== undefined) {
         response.status(200).type('application/json').send(sensorVersions);
      } else {
         response.status(404);
      }
   };

   var extractValues = function extractValues(values, dataType) {
      var result = { timestamp: values.timestamp, values: {} };
      var keys   = Object.keys(values[dataType].values);
      
      keys.forEach(key => result.values[key] = values[dataType].values[key]);

      result.unit = values[dataType].unit;
      return result;
   };

   var resetData = function resetData() {
      calibratedSensorValues = undefined;
      rawSensorValues        = undefined;
      sensorTemperatures     = undefined;
   };

   var onSensorValuesReceived = function onSensorValuesReceived(values) {
      if (valuesContainsTimestampOnly(values) && !valuesContainsAllData(values)) {
         resetData();
         return;
      }

      if (valuesContainsAllData(values)) {
         calibratedSensorValues = extractValues(values, 'calibratedValues');
         rawSensorValues        = extractValues(values, 'rawValues');
         sensorTemperatures     = extractValues(values, 'temperatures');
      } else {
         resetData();
         LOGGER.logError('received invalid sensor values: ' + JSON.stringify(values));
      }
   };

   var onSensorStateReceived = function onSensorStateReceived(state) {
      if (stateContainsAllData(state)) {
         sensorVersions = {
            software: state.versions.software,
            hardware: state.versions.hardware
         };
      } else {
         sensorVersions = undefined;
      }
   };

   app.get(PATH_PREFIX + '/sensor/values/calibrated', sendCalibratedSensorValues);
   app.get(PATH_PREFIX + '/sensor/values/raw', sendRawSensorValues);
   app.get(PATH_PREFIX + '/sensor/values/temperature', sendSensorTemperatures);
   app.get(PATH_PREFIX + '/sensor/versions', sendSensorVersions);
   
   bus.subscribeToPublication(spectroscope.shared.topics.SENSOR_VALUES, onSensorValuesReceived);
   bus.subscribeToPublication(spectroscope.shared.topics.SENSOR_STATE, onSensorStateReceived);
};