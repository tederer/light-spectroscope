/* global spectroscope, assertNamespace, common, Chart, setTimeout, navigator */

assertNamespace('spectroscope.client');

spectroscope.client.ChartTab = function ChartTab(bus) {

   const CART_CANVAS_CSS_SELECTOR = '#chartTab #chartCanvas';
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
   
   var getWaveLengthNames = function getWaveLengthNames(sensorValues) {
      if (sensorValues === undefined) {
         return [];
      }

      return Object.keys(sensorValues.rawValues.values).sort();
   };

   var getLabels = function getLabels(sensorValues) {
      if (sensorValues === undefined) {
         return [];
      }

      return getWaveLengthNames(sensorValues).map(waveLength => waveLength.replace(/(\d+)/, '$1 '));
   };

   var getDatasetData = function getDatasetData(sensorValues) {
      var data = [];

      if (sensorValues === undefined) {
         return data;
      }

      getWaveLengthNames(sensorValues).forEach(waveLengthName => data.push(sensorValues.calibratedValues.values[waveLengthName]));

      return data;
   };

   var getBackgroundColor = function getBackgroundColor(sensorValues) {
      if (sensorValues === undefined) {
         return [];
      }

      return getWaveLengthNames(sensorValues).map(waveLengthName => BACKGROUND_COLORS[waveLengthName] ?? '#FFFFFF');
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

   var showSensorValues = function showSensorValues(sensorValues) {
      chart.data.labels                         = getLabels(sensorValues);
      chart.data.datasets['0'].data             = getDatasetData(sensorValues);
      chart.data.datasets['0'].backgroundColor  = getBackgroundColor(sensorValues);
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
};