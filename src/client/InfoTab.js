/* global spectroscope, assertNamespace, common */

assertNamespace('spectroscope.client');

spectroscope.client.InfoTab = function InfoTab(bus) {

   const CSS_SELECTOR       = '#infoTab #values';
   const SENSOR_CHIP_NAMES  = ['AS72651', 'AS72652', 'AS72653'];
   const TEMPERATURE_PREFIX = 'temperature';
   const validSensorValues  = (new spectroscope.SensorValuesValidator()).containsAllData;
   const validSensorState   = (new spectroscope.SensorStateValidator()).containsAllData;

   var connected        = false;
   var tableInitialized = false;
   var sensorState;
   var sensorValues;

   var createTable = function createTable() {
      var content = '<table class="table table-dark table-striped"><thead></thead><tbody>';
      content += '<tr class="table-light"><td>service version</td><td id="serviceVersion"></tr>';
      content += '<tr class="table-light"><td>sensor software version</td><td id="softwareVersion"></tr>';
      content += '<tr class="table-light"><td>sensor hardware version</td><td id="hardwareVersion"></tr>';
      SENSOR_CHIP_NAMES.forEach(chipName => {
         content += '<tr class="table-light"><td>temperature ' + chipName + '</td>' +
                    '<td id="' + TEMPERATURE_PREFIX + chipName +'"></tr>';
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
         tableInitialized = false;
         return;
      }
      
      if (sensorState !== undefined) {
         if (!tableInitialized) {
            tableInitialized = true;
            createTable();
         }
         
         $(CSS_SELECTOR + ' #serviceVersion').text(sensorState.versions.service);
         $(CSS_SELECTOR + ' #softwareVersion').text(sensorState.versions.software);
         $(CSS_SELECTOR + ' #hardwareVersion').text(sensorState.versions.hardware);
      }

      if (sensorValues !== undefined) {
         SENSOR_CHIP_NAMES.forEach(chipName => {
            var unit = sensorValues.temperatures.unit;
            $(CSS_SELECTOR + ' #' + TEMPERATURE_PREFIX + chipName).text(sensorValues.temperatures.values[chipName] + ' ' + unit);
         });
      }
   };

   var onConnected = function onConnected(connectedState) {
      if (connected !== connectedState) {
         connected = connectedState;
         if (!connected) {
            sensorState  = undefined;
            sensorValues = undefined;
         }
         updateUi();
      }
   };

   var onSensorValuesReceived = function onSensorValuesReceived(values) {
      if (validSensorValues(values) && (((sensorValues ?? {}).timestamp ?? 0) < values.timestamp)) {
         sensorValues = values;
         updateUi();
      }
   };

   var onSensorStateReceived = function onSensorStateReceived(state) {
      if (validSensorState(state)) {
         sensorState = state;
         updateUi();
      }
   };

   bus.subscribeToPublication(spectroscope.client.topics.CONNECTED, onConnected);
   bus.subscribeToPublication(spectroscope.shared.topics.SENSOR_STATE, onSensorStateReceived);
   bus.subscribeToPublication(spectroscope.shared.topics.SENSOR_VALUES, onSensorValuesReceived);
};