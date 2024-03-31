'use strict';

/**
 * cloudcast service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::cloudcast.cloudcast');
