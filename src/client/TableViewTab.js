/* global spectroscope, assertNamespace, common, navigator, setTimeout */

assertNamespace('spectroscope.client');

spectroscope.client.TableViewTab = function TableViewTab(bus) {

   const VALUES_CSS_SELECTOR = '#tableViewTab #values';
   const UNIT_CSS_SELECTOR   = '#tableViewTab #unit';
   const RAW_PREFIX          = 'raw_';
   const CALIBRATED_PREFIX   = 'calibrated_';
   const COLOR_PREFIX        = 'color_';
   const OK                  = 'okState';
   const ERROR               = 'errorState';

   var connected        = false;
   var tableInitialized = false;
   var unitInitialized  = false;
   var sensorValues;
   var waveLengthNames;
   var copyToClipboardTask;

   var setUnit = function setUnit(unit) {
      $(UNIT_CSS_SELECTOR).text(' (in ' + unit + ')');
   };

   var removeUnit = function removeUnit() {
      $(UNIT_CSS_SELECTOR).text('');
   };

   var createTable = function createTable(waveLengthNames) {
      var content = '<table class="table table-dark table-striped"><thead><th></th><th>wave length</th><th>calibrated</th><th>raw</th></thead><tbody>';
      waveLengthNames.forEach(name => {
         var formattedRowName = name.replace(/(\d+)/, '$1 ');
         content +=  '<tr class="table-light">' +
                     '<td><div class="' + COLOR_PREFIX + name   + '">&nbsp;</div></td>' + 
                     '<td>'     + formattedRowName         + '</td>' + 
                     '<td id="' + CALIBRATED_PREFIX + name + '"></td>' +
                     '<td id="' + RAW_PREFIX + name        + '"></td></tr>';
      });
      content += '</tbody></table>';
      $(VALUES_CSS_SELECTOR).html(content);
   };

   var removeTable = function removeTable() {
      $(VALUES_CSS_SELECTOR).html('');
   };

   var updateUi = function updateUi() {
      if (!connected) {
         removeTable();
         removeUnit();
         waveLengthNames  = undefined;
         tableInitialized = false;
         unitInitialized  = false;
         return;
      }
      
      if (sensorValues !== undefined) {
         if (!tableInitialized) {
            tableInitialized = true;
            waveLengthNames  = Object.keys(sensorValues.rawValues.values).sort();
            createTable(waveLengthNames);
         }

         if (!unitInitialized) {
            unitInitialized = true;
            setUnit(sensorValues.calibratedValues.unit);
         }
         
         [{values: 'calibratedValues', prefix: CALIBRATED_PREFIX}, {values: 'rawValues', prefix: RAW_PREFIX}].forEach(tableColumn => {
            waveLengthNames.forEach(waveLengthName => {
               var value = sensorValues[tableColumn.values].values[waveLengthName];
               $(VALUES_CSS_SELECTOR + ' #' + tableColumn.prefix + waveLengthName).text(value);
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

   var highlightClipboardIcon = function highlightClipboardIcon(cssClassToUse) {
      $('#copyToClipboardIcon').addClass(cssClassToUse);
      copyToClipboardTask = setTimeout(() => {
         $('#copyToClipboardIcon').removeClass(cssClassToUse);
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
            text += sensorValues.calibratedValues.values[waveLengthName] + ';';
         });
         text += '\nraw values:\n' + heading + '\n';
         waveLengthNames.forEach((waveLengthName, index) => {
            text += sensorValues.rawValues.values[waveLengthName] + ';';
         });
         navigator.clipboard.writeText(text)
            .then(()  => highlightClipboardIcon(OK))
            .catch(() => highlightClipboardIcon(ERROR));
      }
   };

   bus.subscribeToPublication(spectroscope.client.topics.CONNECTED, onConnected);
   bus.subscribeToPublication(spectroscope.shared.topics.SENSOR_VALUES, onSensorValuesReceived);

   $('#copyToClipboardIcon').click(copyDataToClipboard);
};