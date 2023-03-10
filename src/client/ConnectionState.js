/* global spectroscope, assertNamespace, common */

assertNamespace('spectroscope.client');

spectroscope.client.ConnectionState = function ConnectionState(bus) {

   var sensorConnectedToService = false;
   var webSocketConnected       = false;
   var overallConnected         = false;
   var lastPublishedOverallConnected;

   var publishOverallState = function publishOverallState() {
      if (lastPublishedOverallConnected !== overallConnected) {
         bus.publish(spectroscope.client.topics.CONNECTED, overallConnected);
         lastPublishedOverallConnected = overallConnected;
      }
   };

   var setMessage = function setMessage(msg) {
      $('#connectionState #message').text(msg);
   };

   var updateUi = function updateUi() {
      overallConnected = sensorConnectedToService && webSocketConnected;
      publishOverallState();

      if (overallConnected) {
         $('#connectionState').addClass('d-none');
         setMessage('');
      } else {
         var msg = webSocketConnected ? 'service not connected to sensor' : 'no WebSocket connection to service';
         setMessage(msg);
         $('#connectionState').removeClass('d-none');
      }
   };

   var onWebSocketConnected = function onWebSocketConnected(connected) {
      webSocketConnected = connected;
      updateUi();
   };

   var onSensorStateReceived = function onSensorStateReceived(state) {
      sensorConnectedToService = state.connected ?? false;
      updateUi();
   };

   bus.subscribeToPublication(common.infrastructure.busbridge.CONNECTION_STATE_TOPIC, onWebSocketConnected);
   bus.subscribeToPublication(spectroscope.shared.topics.SENSOR_STATE, onSensorStateReceived);
};