/* global assertNamespace, common, spectroscope */

require('./common/NamespaceUtils.js');

assertNamespace('spectroscope');

spectroscope.SensorStateValidator = function SensorStateValidator() {

   this.containsAllData = function containsAllData(state) {
      return   (typeof state === 'object') &&
               (typeof state.versions === 'object') &&
               (typeof state.versions.software === 'string') &&
               (typeof state.versions.hardware === 'string') &&
               (typeof state.versions.service  === 'string') &&
               (typeof state.connected         === 'boolean');
   };
};