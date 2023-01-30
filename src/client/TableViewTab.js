/* global spectroscope, assertNamespace, common, navigator, setTimeout */

assertNamespace('spectroscope.client');

spectroscope.client.TableViewTab = function TableViewTab(bus) {

   const TABLE_CSS_SELECTOR = '#tableViewTab #values';
   const RAW_PREFIX          = 'raw_';
   const CALIBRATED_PREFIX   = 'calibrated_';
   const COLOR_PREFIX        = 'color_';
   
   var tableInitialized = false;
   
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
      $(TABLE_CSS_SELECTOR).html(content);
   };

   var removeTable = function removeTable() {
      $(TABLE_CSS_SELECTOR).html('');
      tableInitialized = false;
   };

   var showSensorValues = function showSensorValues(sensorValues, waveLengthNames) {
      if (!tableInitialized) {
         createTable(waveLengthNames);
         tableInitialized = true;
      }

      [{values: 'calibratedValues', prefix: CALIBRATED_PREFIX}, {values: 'rawValues', prefix: RAW_PREFIX}].forEach(tableColumn => {
         waveLengthNames.forEach(waveLengthName => {
            var value = sensorValues[tableColumn.values].values[waveLengthName];
            $(TABLE_CSS_SELECTOR + ' #' + tableColumn.prefix + waveLengthName).text(value);
         });   
      });
   };

   var settings = {
      bus:              bus,             
      tabId:            'tableViewTab',     
      initializeUi:     () => {},    
      removeUi:         removeTable,
      showSensorValues: showSensorValues
   };

   new spectroscope.client.SensorValueTab(settings);
};