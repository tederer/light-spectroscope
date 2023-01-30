/* global spectroscope, assertNamespace */

require('./common/NamespaceUtils.js');

assertNamespace('spectroscope.shared.topics');

//                PUBLICATIONS

/**
 * The server publishes on this topic the current state of the light spectroscope sensor
 *
 * example: 
 * {
 *    "versions":
 *       {  "software": "12.0.0",
 *          "hardware": "0x4041",
 *          "service":  "0.1.0"
 *       },
 *    "connected":true
 * }
 */
spectroscope.shared.topics.SENSOR_STATE = '/shared/sensorState';


/**
 * The server publishes on this topic the current values of the light spectroscope sensor
 *
 * example: 
 * {
 *    "timestamp":1675096704044,
 *    "rawValues":{
 *       "unit":"µW/cm²",
 *       "values":{"410nm":0,"435nm":0,"460nm":1,"485nm":0,"510nm":0,"535nm":0,"560nm":1,"585nm":0,"610nm":0,"645nm":1,"680nm":0,"705nm":0,"730nm":0,"760nm":0,"810nm":0,"860nm":0,"900nm":0,"940nm":0}
 *    },
 *    "calibratedValues":{
 *       "unit":"µW/cm²",
 *       "values":{"410nm":0,"435nm":0,"460nm":1,"485nm":0,"510nm":0,"535nm":0,"560nm":0.6,"585nm":0,"610nm":0,"645nm":0.5,"680nm":0,"705nm":0,"730nm":0,"760nm":0,"810nm":0,"860nm":0,"900nm":0,"940nm":0}
 *    },
 *    "temperatures":{
 *       "unit":"°C",
 *       "values":{"AS72651":27,"AS72652":26,"AS72653":25}
 *    }
 * }
 */
spectroscope.shared.topics.SENSOR_VALUES = '/shared/sensorValues';
