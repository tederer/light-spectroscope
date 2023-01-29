/* global spectroscope, assertNamespace, common, Chart, setTimeout, navigator */

assertNamespace('spectroscope.client');

spectroscope.client.ChartTab = function ChartTab(bus) {

   const CSS_SELECTOR           = '#chartTab #chartCanvas';
   const UNIT_CSS_SELECTOR      = '#chartTab #unit';
   const CLIPBOARD_CSS_SELECTOR = '#chartTab #copyToClipboardIcon';
   const OK                     = 'okState';
   const ERROR                  = 'errorState';
   const BACKGROUND_COLORS      = {
      '410nm': '#8700FA',
      '435nm': '#4517FE',
      '460nm': '#0274FB',
      '485nm': '#00ABF3',
      '510nm': '#00E063',
      '535nm': '#56E13E',
      '560nm': '#B2E01B',
      '585nm': '#FED401',
      '610nm': '#FD8D00',
      '645nm': '#FF5E01',
      '680nm': '#FD3000',
      '705nm': '#F01801',
      '730nm': '#D11000',
      '760nm': '#A80603'
   };

   var connected        = false;
   var unitInitialized  = false;
   var chart;
   var sensorValues;
   var copyToClipboardTask;

   var setUnit = function setUnit(unit) {
      $(UNIT_CSS_SELECTOR).text(' (in ' + unit + ')');
   };

   var removeUnit = function removeUnit() {
      $(UNIT_CSS_SELECTOR).text('');
   };

   var getWaveLengthNames = function getWaveLengthNames() {
      if (sensorValues === undefined) {
         return [];
      }

      return Object.keys(sensorValues.rawValues.values).sort();
   };

   var getLabels = function getLabels() {
      if (sensorValues === undefined) {
         return [];
      }

      return getWaveLengthNames().map(waveLength => waveLength.replace(/(\d+)/, '$1 '));
   };

   var getDatasetData = function getDatasetData() {
      var data = [];

      if (sensorValues === undefined) {
         return data;
      }

      getWaveLengthNames().forEach(waveLengthName => data.push(sensorValues.calibratedValues.values[waveLengthName]));

      return data;
   };

   var getBackgroundColor = function getBackgroundColor() {
      if (sensorValues === undefined) {
         return [];
      }

      return getWaveLengthNames().map(waveLengthName => BACKGROUND_COLORS[waveLengthName] ?? '#FFFFFF');
   };

   var initializeChart = function initializeChart() {
      var chartConfig = {
         type: 'bar',
         data: {
            labels: [],
            datasets: [{
               data: [],
               borderWidth: 1,
               backgroundColor: []
            }],
         },
         options: {
            scales: {
               x: {
                  ticks: {
                     autoSkip: false,
                     maxRotation: 90,
                     minRotation: 90
                  }
               }
            },
            plugins: {
               legend: {
                  display: false
               }
            }
         }
      };
     
      chart = new Chart($(CSS_SELECTOR), chartConfig);   
   };

   var updateUi = function updateUi() {
      if (chart === undefined) {
         initializeChart();
      }
      
      if (!connected) {
         removeUnit();
         unitInitialized = false;
         return;
      }
      
      if (connected && (sensorValues !== undefined) && !unitInitialized) {
         unitInitialized = true;
         setUnit(sensorValues.calibratedValues.unit);
      }

      chart.data.labels                         = getLabels();
      chart.data.datasets['0'].data             = getDatasetData();
      chart.data.datasets['0'].backgroundColor  = getBackgroundColor();
      chart.update();
   };

   var validSensorValues = function validSensorValues(values) {
      return   (typeof values === 'object') &&
               (typeof values.timestamp === 'number') &&
               (typeof values.rawValues === 'object') &&
               (typeof values.calibratedValues === 'object') &&
               (typeof values.temperatures === 'object') &&
               (values.rawValues.length === values.calibratedValues.length);
   };

   var onConnected = function onConnected(connectedState) {
      if (connected !== connectedState) {
         connected = connectedState;
         if (!connected) {
            sensorValues    = undefined;
            unitInitialized = false;
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

   var copyDataToClipboard = function copyDataToClipboard() {
      chart.update(); // TODO remove me
      if ((copyToClipboardTask === undefined) && (sensorValues !== undefined)) {
         var text            = (new Date()).toISOString() + '\ncalibrated values:\n';
         var waveLengthNames = getWaveLengthNames();
         var heading         = '';

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
   
   $(CLIPBOARD_CSS_SELECTOR).click(copyDataToClipboard);
};