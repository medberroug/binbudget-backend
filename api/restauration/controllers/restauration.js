'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

module.exports = {
    async getDashboardDataResto(ctx) {
        let entities;
        let entitiesEvents;
        const { id } = ctx.params;
        if (ctx.query._q) {
            entitiesEvents = await strapi.services.restauration.search();
        } else {
            entitiesEvents = await strapi.services.restauration.find();
        }
        let restauration = entitiesEvents.map(entity => sanitizeEntity(entity, { model: strapi.models.restauration }));

        let items = []
        for (let i = 0; i < restauration.length; i++) {
            for (let j = 0; j < restauration[i].items.length; j++) {
                if (restauration[i].items[j].eventServiceProvider == id) {
                    items.push({
                        client: restauration[i].byClient,
                        details: restauration[i].items[j]
                    })
                }
            }
        }
        let entitiesInvoices
        let myInvoices
        entitiesInvoices = await strapi.services.invoice.find({ withTypeId: id });
        myInvoices = entitiesInvoices.map(entity => sanitizeEntity(entity, { model: strapi.models.invoice }));
        let result = {
            // items: items,
            clientByRevenue: await clientByRevenue(items),
            topSellingProducts: topSellingProduct(items),
            totalRevenue: totalRevenue(myInvoices),
            calculateOrders: calculateOrders(items)
        }
        return result
    },
};
