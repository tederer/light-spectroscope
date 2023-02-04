/* global spectroscope, assertNamespace, common, Chart, setTimeout, navigator, clearTimeout, window */

assertNamespace('spectroscope.client');

spectroscope.client.ChartTab = function ChartTab(bus) {

   const CART_CANVAS_CSS_SELECTOR = '#chartTab #chartCanvas';
   const VALUE_TYPE_CSS_SELECTOR  = '#chartTab #valuesTypeToDisplay';
   const LIGHT_GREY               = '#D3D3D3';

   const BACKGROUND_COLORS        = {
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

   var chart;
   var dataTypeToDisplay;

   var getLabels = function getLabels(sensorValues, waveLengthNames) {
      if (sensorValues === undefined) {
         return [];
      }

      return waveLengthNames.map(waveLength => waveLength.replace(/(\d+)/, '$1 '));
   };

   var getDatasetData = function getDatasetData(sensorValues, waveLengthNames) {
      var data = [];

      if ((sensorValues === undefined) || (dataTypeToDisplay === undefined)) {
         return data;
      }

      waveLengthNames.forEach(waveLengthName => data.push(sensorValues[dataTypeToDisplay].values[waveLengthName]));

      return data;
   };

   var getBackgroundColor = function getBackgroundColor(sensorValues, waveLengthNames) {
      if (sensorValues === undefined) {
         return [];
      }

      return waveLengthNames.map(waveLengthName => BACKGROUND_COLORS[waveLengthName] ?? LIGHT_GREY);
   };

   var initializeUi = function initializeUi() {
      if (chart !== undefined) {
         return;
      }
      
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
            maintainAspectRatio: false,
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
     
      chart = new Chart($(CART_CANVAS_CSS_SELECTOR), chartConfig);   
   };

   var clearChartContent = function clearChartContent() {
      chart.data.labels                         = [];
      chart.data.datasets['0'].data             = [];
      chart.data.datasets['0'].backgroundColor  = [];
      chart.update();
   
   };

   var updateDateTypeToDisplay = function updateDateTypeToDisplay() {
      dataTypeToDisplay = $(VALUE_TYPE_CSS_SELECTOR + ' :selected').val();
   };

   var showSensorValues = function showSensorValues(sensorValues, waveLengthNames) {
      if (dataTypeToDisplay === undefined) {
         updateDateTypeToDisplay();
      }

      chart.data.labels                         = getLabels(sensorValues, waveLengthNames);
      chart.data.datasets['0'].data             = getDatasetData(sensorValues, waveLengthNames);
      chart.data.datasets['0'].backgroundColor  = getBackgroundColor(sensorValues, waveLengthNames);
      chart.update();
   };

   var settings = {
      bus:              bus,             
      tabId:            'chartTab',     
      initializeUi:     initializeUi,    
      removeUi:         clearChartContent,
      showSensorValues: showSensorValues
   };

   new spectroscope.client.SensorValueTab(settings);

   $(VALUE_TYPE_CSS_SELECTOR).change(updateDateTypeToDisplay);
};