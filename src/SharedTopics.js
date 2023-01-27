/* global spectroscope, assertNamespace */

require('./common/NamespaceUtils.js');

assertNamespace('spectroscope.shared.topics');

//                PUBLICATIONS

/**
 * The server publishes on this topic the current state of the light spectroscope sensor
 *
 * example: {"versions":{"software":"12.0.0","hardware":"0x4041"}}
 */
spectroscope.shared.topics.SENSOR_STATE = '/shared/sensorState';


/**
 * The server publishes on this topic the current values of the light spectroscope sensor
 *
 * example: TODO
 */
spectroscope.shared.topics.SENSOR_VALUES = '/shared/sensorValues';
