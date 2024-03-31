'use strict';

/**
 * cloudcast router
 */

const { createCoreRouter } = require('@strapi/strapi').factories;

module.exports = createCoreRouter('api::cloudcast.cloudcast');
