/* global assertNamespace, common, spectroscope */

require('./common/NamespaceUtils.js');

assertNamespace('spectroscope');

spectroscope.SensorValuesValidator = function SensorValuesValidator() {

   var thisInstance = this;

   this.containsTimestampOnly = function containsTimestampOnly(values) {
      return   (typeof values                   === 'object') &&
               (typeof values.timestamp         === 'number');
   };

   this.containsAllData = function containsAllData(values) {
      return   thisInstance.containsTimestampOnly(values)     &&
               (typeof values.rawValues         === 'object') &&
               (typeof values.calibratedValues  === 'object') &&
               (typeof values.temperatures      === 'object') &&
               (values.rawValues.length         === values.calibratedValues.length);
   };
};