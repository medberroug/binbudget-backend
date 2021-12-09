'use strict';
const { parseMultipartData, sanitizeEntity } = require('strapi-utils');
/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

module.exports = {
    async editStatus(ctx) {
        const { id } = ctx.params;

        let entity;
        if (ctx.is('multipart')) {
            const { data, files } = parseMultipartData(ctx);
            entity = await strapi.services.events.update({ id }, data, {
                files,
            });
        } else {
            console.log(ctx.request.body);
            entity = await strapi.services.events.update({ id }, ctx.request.body);
        }

        return sanitizeEntity(entity, { model: strapi.models.events });
    },
};
