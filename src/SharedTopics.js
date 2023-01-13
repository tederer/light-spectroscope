/* global spectroscope, assertNamespace */

require('./common/NamespaceUtils.js');

assertNamespace('spectroscope.shared.topics');

//                PUBLICATIONS

/**
 * The server publishes on this topic the current list of addresses that were not at home.
 *
 * example: [{"street":"Hauptstraße","number":"33","creationTimestamp":1590331561740,"id":2},{"street":"Seestraße","number":"11","creationTimestamp":1590331617982,"id":3}]
 */
spectroscope.shared.topics.TO_BE_DEFINED = '/shared/ToBeDefined'; // TODO
