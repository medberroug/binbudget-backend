'use strict';
const { sanitizeEntity } = require('strapi-utils');
/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

module.exports = {
    async find(ctx) {
        let entities;
        if (ctx.query._q) {
            entities = await strapi.services.marketcategory.search(ctx.query);
        } else {
            entities = await strapi.services.marketcategory.find(ctx.query);
        }
        let marketCategories = entities.map(entity => sanitizeEntity(entity, { model: strapi.models.marketcategory }));
        let trueStatusCategories = []
        for (let i = 0; i < marketCategories.length; i++) {
            console.log(marketCategories[i].status);
            if (marketCategories[i].status==true) {
                trueStatusCategories.push(marketCategories[i])
            }
        }
        return trueStatusCategories
    },
};
