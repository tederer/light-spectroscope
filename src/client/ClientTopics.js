/* global spectroscope, assertNamespace */

require('./common/NamespaceUtils.js');

assertNamespace('spectroscope.client.topics');

//                PUBLICATIONS

/**
 * The client publishes on this topic if the connection to the sensor is up and running.
 *
 * example: true
 */
spectroscope.client.topics.CONNECTED = '/client/connected';
