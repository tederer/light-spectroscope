/* global assertNamespace, common, spectroscope, setTimeout, clearTimeout */

require('./common/NamespaceUtils.js');
require('./common/logging/LoggingSystem.js');
require('./SharedTopics.js');
require('./SensorConnection.js');

assertNamespace('spectroscope');

/**
 * constructor function of a light spectroscope sensor. It polls the current values in
 * the interval POLLING_INTERVAL_IN_MS and publishes them on the bus using the topic 
 * spectroscope.shared.topics.SENSOR_VALUES.
 * 
 * serialPortPath    (e.g. 'com5', '/dev/tty-usbserial1', ...)
 * bus               instance of common.infrastructure.bus.Bus
 */
spectroscope.Sensor = function Sensor(serialPortPath, bus) {

   const POLLING_INTERVAL_IN_MS  = 1000;
   
   const WAVELENGTHS             =  {  description: 'wave lengths',
                                       mapping: [  {sourceIndex: 12, name: '410nm'},
                                                   {sourceIndex: 13, name: '435nm'},
                                                   {sourceIndex: 14, name: '460nm'},
                                                   {sourceIndex: 15, name: '485nm'},
                                                   {sourceIndex: 16, name: '510nm'},
                                                   {sourceIndex: 17, name: '535nm'},
                                                   {sourceIndex:  6, name: '560nm'},
                                                   {sourceIndex:  7, name: '585nm'},
                                                   {sourceIndex:  0, name: '610nm'},
                                                   {sourceIndex:  8, name: '645nm'},
                                                   {sourceIndex:  1, name: '680nm'},
                                                   {sourceIndex:  9, name: '705nm'},
                                                   {sourceIndex:  2, name: '730nm'},
                                                   {sourceIndex:  3, name: '760nm'},
                                                   {sourceIndex:  4, name: '810nm'},
                                                   {sourceIndex:  5, name: '860nm'},
                                                   {sourceIndex: 10, name: '900nm'},
                                                   {sourceIndex: 11, name: '940nm'}]
                                    };

   const SENSOR_DEVICES          =  {  description: 'sensor devices',
                                       mapping: [  {sourceIndex: 0, name: 'AS72651'},
                                                   {sourceIndex: 1, name: 'AS72652'},
                                                   {sourceIndex: 2, name: 'AS72653'}]
                                    };
   
   const  LOGGER                 = common.logging.LoggingSystem.createLogger('Sensor');

   var connection = new spectroscope.SensorConnection(serialPortPath, bus);
   var pendingPollTask;
   var lastPubishedValues;
   
   var nowInMs = function nowInMs() {
      return Date.now();
   };

   var mapCommaSeparatedValues = function mapCommaSeparatedValues(commaSeparatedValues, format, unit) {
      const separator = '|';
      var result = {unit: unit, values: {}};
      var values = commaSeparatedValues.replace(/,\s*/g, separator).split(separator);

      if (values.length !== format.mapping.length) {
         throw 'cannot map ' + format.description + ' because number of values (' + values.length + ') is not ' + format.mapping.length;
      }

      format.mapping.forEach(mapping => result.values[mapping.name] = Number.parseFloat(values[mapping.sourceIndex]));
      
      return result;
   };

   var mapValues = function mapValues(rawValues) {
      return mapCommaSeparatedValues(rawValues, WAVELENGTHS, 'µW/cm²');
   };

   var mapTemperatures = function mapTemperatures(temperatures) {
      return mapCommaSeparatedValues(temperatures, SENSOR_DEVICES, '°C');
   };

   var publishValues = function publishValues(timestamp, rawValues, calibratedValues, temperatures) {
      LOGGER.logDebug('requested to publish values (timestamp=' + timestamp + ',rawValues=' + rawValues +
                      ',calibratedValues=' + calibratedValues + ',temperatures=' + temperatures + ')');
      var values = { timestamp: timestamp };
      if (rawValues !== undefined) {
         values.rawValues        = mapValues(rawValues);
         values.calibratedValues = mapValues(calibratedValues);
         values.temperatures     = mapTemperatures(temperatures);
      }

      var stringifiedValues = JSON.stringify(values);
      if (lastPubishedValues !== stringifiedValues) {
         bus.publish(spectroscope.shared.topics.SENSOR_VALUES, values);
         lastPubishedValues = stringifiedValues;
      }
   };

   var publishEmptyValues = function publishEmptyValues() {
      publishValues(nowInMs());
   };

   var pollData = async function pollData() {
      pendingPollTask     = undefined;
      var startInMs       = nowInMs();
      var continuePolling = true;

      try {
         var rawValues        = await connection.sendCommand('ATDATA');
         var calibratedValues = await connection.sendCommand('ATCDATA');
         var temperatures     = await connection.sendCommand('ATTEMP');
         publishValues(startInMs, rawValues, calibratedValues, temperatures);
      } catch(error) {
         LOGGER.logError('polling failed: ' + error);
         continuePolling = false;
         publishEmptyValues();
         connection.restart();
      }

      if (continuePolling) {
         var sleepDurationInMs = Math.max(0, POLLING_INTERVAL_IN_MS - (nowInMs() - startInMs));
         pendingPollTask       = setTimeout(pollData, sleepDurationInMs);
      }
   };

   var onConnectionClosed = function onConnectionClosed() {
      if (pendingPollTask !== undefined) {
         LOGGER.logInfo('canceling pending polling task because connection got closed');
         var pendingPollTaskToClear = pendingPollTask;
         pendingPollTask            = undefined;
         clearTimeout(pendingPollTaskToClear);
      }
   };

   publishEmptyValues();
   connection.onConnectionOpened(pollData);
   connection.onConnectionClosed(onConnectionClosed);
   connection.open();
};