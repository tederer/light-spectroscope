/* global spectroscope, assertNamespace, common, navigator, setTimeout */

assertNamespace('spectroscope.client');

spectroscope.client.SensorValueTab = function SensorValueTab(settings) {

   const OK                      = 'okState';
   const ERROR                   = 'errorState';

   var connected                 = false;
   var uiInitialized             = false;
   var unitInitialized           = false;
   var sensorValues;
   var waveLengthNames;
   var copyToClipboardTask;

   var bus                       = settings.bus;
   var tabId                     = settings.tabId;
   var initializeUi              = settings.initializeUi;
   var removeUi                  = settings.removeUi;
   var showSensorValues          = settings.showSensorValues;

   const UNIT_CSS_SELECTOR       = '#' + tabId + ' #unit';
   const CLIPBOARD_CSS_SELECTOR  = '#' + tabId + ' #copyToClipboardIcon';
   
   var setUnit = function setUnit(unit) {
      $(UNIT_CSS_SELECTOR).text(' (in ' + unit + ')');
   };

   var removeUnit = function removeUnit() {
      $(UNIT_CSS_SELECTOR).text('');
   };

   var updateUi = function updateUi() {
      if (!connected) {
         removeUi();
         removeUnit();
         waveLengthNames  = undefined;
         uiInitialized    = false;
         unitInitialized  = false;
         return;
      }
      
      if (sensorValues !== undefined) {
         if (!uiInitialized) {
            uiInitialized = true;
            initializeUi();
         }

         if (!unitInitialized) {
            unitInitialized = true;
            setUnit(sensorValues.calibratedValues.unit);
         }
         
         showSensorValues(sensorValues);
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
      return   (typeof values                   === 'object') &&
               (typeof values.timestamp         === 'number') &&
               (typeof values.rawValues         === 'object') &&
               (typeof values.calibratedValues  === 'object') &&
               (typeof values.temperatures      === 'object') &&
               (values.rawValues.length         === values.calibratedValues.length);
   };

   var onSensorValuesReceived = function onSensorValuesReceived(values) {
      if (validSensorValues(values) && (((sensorValues ?? {}).timestamp ?? 0) < values.timestamp)) {
         sensorValues = values;
         updateUi();
      }
   };

   var highlightClipboardIcon = function highlightClipboardIcon(cssClassToUse) {
      $(CLIPBOARD_CSS_SELECTOR).addClass(cssClassToUse);
      copyToClipboardTask = setTimeout(() => {
         $(CLIPBOARD_CSS_SELECTOR).removeClass(cssClassToUse);
         copyToClipboardTask = undefined;
      }, 1000);
   };

   var copyDataToClipboard = function copyDataToClipboard() {
      if ((copyToClipboardTask === undefined) && (waveLengthNames !== undefined) && (sensorValues !== undefined)) {
         var text    = (new Date()).toISOString() + '\ncalibrated values:\n';
         var heading = '';
         waveLengthNames.forEach(waveLengthName => {
            heading += waveLengthName + ';';
         });
         text += heading + '\n';
         waveLengthNames.forEach(waveLengthName => {
            text += sensorValues.calibratedValues.values[waveLengthName].toLocaleString() + ';';
         });
         text += '\nraw values:\n' + heading + '\n';
         waveLengthNames.forEach((waveLengthName, index) => {
            text += sensorValues.rawValues.values[waveLengthName].toLocaleString() + ';';
         });
         navigator.clipboard.writeText(text)
            .then(()  => highlightClipboardIcon(OK))
            .catch(() => highlightClipboardIcon(ERROR));
      }
   };

   bus.subscribeToPublication(spectroscope.client.topics.CONNECTED, onConnected);
   bus.subscribeToPublication(spectroscope.shared.topics.SENSOR_VALUES, onSensorValuesReceived);

   $(CLIPBOARD_CSS_SELECTOR).click(copyDataToClipboard);
};