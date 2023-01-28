/* global spectroscope, assertNamespace, common */

assertNamespace('spectroscope.client');

spectroscope.client.TableViewTab = function TableViewTab(bus) {

   const CSS_SELECTOR      = '#tableViewTab #values';
   const RAW_PREFIX        = 'raw_';
   const CALIBRATED_PREFIX = 'calibrated_';

   var connected        = false;
   var tableInitialized = false;
   var sensorValues;
   var waveLengthNames;

   var createTable = function createTable(waveLengthNames) {
      var content = '<table class="table table-dark table-striped"><thead></thead><th>wave length</th><th>calibrated</th><th>raw</th><tbody>';
      waveLengthNames.forEach(name => {
         var formattedRowName = name.replace(/(\d+)/, '$1 ');
         content +=  '<tr class="table-light">' +
                     '<td>'     + formattedRowName         + '</td>' + 
                     '<td id="' + CALIBRATED_PREFIX + name + '"></td>' +
                     '<td id="' + RAW_PREFIX + name        + '"></td></tr>';
      });
      content += '</tbody></table>';
      $(CSS_SELECTOR).html(content);
   };

   var removeTable = function removeTable() {
      $(CSS_SELECTOR).html('');
   };

   var updateUi = function updateUi() {
      if (!connected) {
         removeTable();
         waveLengthNames  = undefined;
         tableInitialized = false;
         return;
      }
      
      if (sensorValues !== undefined) {
         if (!tableInitialized) {
            tableInitialized = true;
            waveLengthNames  = Object.keys(sensorValues.rawValues.values).sort();
            createTable(waveLengthNames);
         }

         [{values: 'calibratedValues', prefix: CALIBRATED_PREFIX}, {values: 'rawValues', prefix: RAW_PREFIX}].forEach(tableColumn => {
            waveLengthNames.forEach(waveLengthName => {
               var value = sensorValues[tableColumn.values].values[waveLengthName];
               $(CSS_SELECTOR + ' #' + tableColumn.prefix + waveLengthName).text(value);
            });   
         });
      }
   };

   var onConnected = function onConnected(connectedState) {
      if (connected !== connectedState) {
         connected = connectedState;
         if (!connected) {
            sensorValues = undefined;
         }
         updateUi();
      }
   };

   var validSensorValues = function validSensorValues(values) {
      return   (typeof values === 'object') &&
               (typeof values.timestamp === 'number') &&
               (typeof values.rawValues === 'object') &&
               (typeof values.calibratedValues === 'object') &&
               (typeof values.temperatures === 'object') &&
               (values.rawValues.length === values.calibratedValues.length);
   };

   var onSensorValuesReceived = function onSensorValuesReceived(values) {
      if (validSensorValues(values) && (((sensorValues ?? {}).timestamp ?? 0) < values.timestamp)) {
         sensorValues = values;
         updateUi();
      }
   };

   bus.subscribeToPublication(spectroscope.client.topics.CONNECTED, onConnected);
   bus.subscribeToPublication(spectroscope.shared.topics.SENSOR_VALUES, onSensorValuesReceived);
};