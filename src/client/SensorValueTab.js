/* global spectroscope, assertNamespace, common, navigator, setTimeout */

assertNamespace('spectroscope.client');

spectroscope.client.SensorValueTab = function SensorValueTab(settings) {

   const OK                      = 'okState';
   const ERROR                   = 'errorState';

   var connected                 = false;
   var uiInitialized             = false;
   var unitInitialized           = false;
   var sensorValues;
   var copyToClipboardTask;

   var bus                       = settings.bus;
   var tabId                     = settings.tabId;
   var initializeUi              = settings.initializeUi;
   var removeUi                  = settings.removeUi;
   var showSensorValues          = settings.showSensorValues;

   const validSensorValues       = (new spectroscope.SensorValuesValidator()).containsAllData;
   const UNIT_CSS_SELECTOR       = '#' + tabId + ' #unit';
   const CLIPBOARD_CSS_SELECTOR  = '#' + tabId + ' #copyToClipboardIcon';
   
   var setUnit = function setUnit(unit) {
      $(UNIT_CSS_SELECTOR).text(' (in ' + unit + ')');
   };

   var removeUnit = function removeUnit() {
      $(UNIT_CSS_SELECTOR).text('');
   };

   var getWaveLengthNames = function getWaveLengthNames() {
      return (sensorValues === undefined) ? [] : Object.keys(sensorValues.rawValues.values).sort();
   };

   var updateUi = function updateUi() {
      if (!connected) {
         removeUi();
         removeUnit();
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

         showSensorValues(sensorValues, getWaveLengthNames());
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

   var formatNumber = function formatNumber(number) {
      return number.toLocaleString().replace(/\s/g, '');
   };

   var copyDataToClipboard = function copyDataToClipboard() {
      if ((copyToClipboardTask === undefined) && (sensorValues !== undefined)) {
         var text            = (new Date()).toISOString() + '\n\ncalibrated values:\n';
         var waveLengthNames = getWaveLengthNames();
         var heading         = '';
         
         waveLengthNames.forEach(waveLengthName => {
            heading += waveLengthName + ';';
         });
         text += heading + '\n';
         waveLengthNames.forEach(waveLengthName => {
            text += formatNumber(sensorValues.calibratedValues.values[waveLengthName]) + ';';
         });
         text += '\n\nraw values:\n' + heading + '\n';
         waveLengthNames.forEach((waveLengthName, index) => {
            text += formatNumber(sensorValues.rawValues.values[waveLengthName]) + ';';
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