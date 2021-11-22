'use strict';
const { sanitizeEntity } = require('strapi-utils');
/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

module.exports = {
    async getListOfPlaces(ctx) {
        let entities;
        const { city } = ctx.params;
        if (ctx.query._q) {
            entities = await strapi.services.eventserviceprovider.search(ctx.query);
        } else {
            entities = await strapi.services.eventserviceprovider.find(ctx.query);
        }
        let eventserviceproviders = entities.map(entity => sanitizeEntity(entity, { model: strapi.models.eventserviceprovider }));
        let inCitySP = []
        let myItems = []
        for (let i = 0; i < eventserviceproviders.length; i++) {
            console.log(eventserviceproviders[i].address.city)
            console.log(city);
            console.log(eventserviceproviders[i].address.city == city);
            if ((eventserviceproviders[i].address.city == city) && (eventserviceproviders[i].status)) {
                for (let j = 0; j < eventserviceproviders[i].items.length; j++) {
                    if (eventserviceproviders[i].items[j].status) {
                        let myspecText = ""
                        for (let k = 0; k < eventserviceproviders[i].items[j].specification.length; k++) {
                            myspecText = myspecText + eventserviceproviders[i].items[j].specification[k].specText + ", "
                        }
                        let newItem = {
                            id: eventserviceproviders[i].items[j].id,
                            logo: strapi.config.get('server.baseUrl', 'defaultValueIfUndefined') + eventserviceproviders[i].logo.url,
                            firstImage: strapi.config.get('server.baseUrl', 'defaultValueIfUndefined') + eventserviceproviders[i].items[j].firstImage.url,
                            name: eventserviceproviders[i].items[j].name,
                            city: eventserviceproviders[i].address.city,
                            rating: eventserviceproviders[i].ratingTotal,
                            spec: myspecText,
                            spId: eventserviceproviders[i].id
                        }
                        myItems.push(newItem)

                    }
                }

            }
        }
        console.log(city);
        return myItems
    },
};
