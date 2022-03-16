'use strict';
const { sanitizeEntity } = require('strapi-utils');
/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

module.exports = {


    async getDashboardData(ctx) {
        let entities;
        let entitiesEvents;
        const { id } = ctx.params;
        if (ctx.query._q) {
            entitiesEvents = await strapi.services.events.search();
        } else {
            entitiesEvents = await strapi.services.events.find();
        }
        let events = entitiesEvents.map(entity => sanitizeEntity(entity, { model: strapi.models.events }));
     
        let eventOrderDetails = []
        for (let i = 0; i < events.length; i++) {
            for (let j = 0; j < events[i].eventOrderDetails.length; j++) {
                if (events[i].eventOrderDetails[j].eventServiceProvider == id) {
                    eventOrderDetails.push({
                        client: events[i].byClient,
                        details: events[i].eventOrderDetails[j]
                    })
                }
            }
        }
        let entitiesInvoices
        let myInvoices
        entitiesInvoices = await strapi.services.invoice.find({ withTypeId: id });
        myInvoices = entitiesInvoices.map(entity => sanitizeEntity(entity, { model: strapi.models.invoice }));
        let result = {
            // eventOrderDetails: eventOrderDetails,
            clientByRevenue: await clientByRevenue(eventOrderDetails),
            topSellingProducts: topSellingProduct(eventOrderDetails),
            totalRevenue: totalRevenue(myInvoices),
            calculateOrders: calculateOrders(eventOrderDetails)
        }
        return result
    },
    async getListOfHosting(ctx) {
        let entities;
        const { city } = ctx.params;
        if (ctx.query._q) {
            entities = await strapi.services.eventserviceprovider.search(ctx.query);
        } else {
            entities = await strapi.services.eventserviceprovider.find(ctx.query);
        }
        let eventserviceproviders = entities.map(entity => sanitizeEntity(entity, { model: strapi.models.eventserviceprovider }));
        let myItems = []
        for (let i = 0; i < eventserviceproviders.length; i++) {

            if ((eventserviceproviders[i].address.city == city) && (eventserviceproviders[i].status)) {
                for (let d = 0; d < eventserviceproviders[i].showIn.length; d++) {
                    if (eventserviceproviders[i].showIn[d].serviceName == "event-hosting") {
                        let newItem = {
                            id: eventserviceproviders[i].id,
                            logo: strapi.config.get('server.baseUrl', 'defaultValueIfUndefined') + eventserviceproviders[i].logo.url,
                            firstImage: strapi.config.get('server.baseUrl', 'defaultValueIfUndefined') + eventserviceproviders[i].topImage.url,
                            name: eventserviceproviders[i].knownName,
                            city: eventserviceproviders[i].address.city,
                            rating: eventserviceproviders[i].ratingTotal,
                            spec: eventserviceproviders[i].smallDescription,
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

    async getListOfRestauration(ctx) {
        let entities;
        const { city } = ctx.params;
        if (ctx.query._q) {
            entities = await strapi.services.eventserviceprovider.search(ctx.query);
        } else {
            entities = await strapi.services.eventserviceprovider.find(ctx.query);
        }
        let eventserviceproviders = entities.map(entity => sanitizeEntity(entity, { model: strapi.models.eventserviceprovider }));
        let myItems = []
        for (let i = 0; i < eventserviceproviders.length; i++) {

            if ((eventserviceproviders[i].address.city == city) && (eventserviceproviders[i].status)) {
                for (let d = 0; d < eventserviceproviders[i].showIn.length; d++) {
                    if (eventserviceproviders[i].showIn[d].serviceName == "event-restauration") {
                        let newItem = {
                            id: eventserviceproviders[i].id,
                            logo: strapi.config.get('server.baseUrl', 'defaultValueIfUndefined') + eventserviceproviders[i].logo.url,
                            firstImage: strapi.config.get('server.baseUrl', 'defaultValueIfUndefined') + eventserviceproviders[i].topImage.url,
                            name: eventserviceproviders[i].knownName,
                            city: eventserviceproviders[i].address.city,
                            rating: eventserviceproviders[i].ratingTotal,
                            spec: eventserviceproviders[i].smallDescription,
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
    async getListOfService(ctx) {
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

            if ((eventserviceproviders[i].address.city == city) && (eventserviceproviders[i].status)) {
                for (let d = 0; d < eventserviceproviders[i].showIn.length; d++) {
                    if (eventserviceproviders[i].showIn[d].serviceName == "event-service") {
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

            }
        }
        console.log(city);
        return myItems
    },
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

            if ((eventserviceproviders[i].address.city == city) && (eventserviceproviders[i].status)) {
                for (let d = 0; d < eventserviceproviders[i].showIn.length; d++) {
                    if (eventserviceproviders[i].showIn[d].serviceName == "event-salle") {
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
                                    spId: eventserviceproviders[i].id,
                                    specName: eventserviceproviders[i].knownName
                                }
                                myItems.push(newItem)

                            }
                        }
                    }
                }

            }
        }
        console.log(city);
        return myItems
    },
};

function topSellingProduct(data) {
    let articlesList = []
    for (let i = 0; i < data.length; i++) {

        if (!isCancelled(data[i].details)) {
            for (let k = 0; k < data[i].details.articles.length; k++) {
                let articleWasBeenFound = false
                for (let j = 0; j < articlesList.length; j++) {
                    console.log("dkhalaaaaaaa");
                    console.log(data[i].details.articles[k].id)
                    console.log(articlesList[j].itemId)
                    if (articlesList[j].itemId == data[i].details.articles[k].itemId) {
                        articleWasBeenFound = true
                        articlesList[j].quantity = articlesList[j].quantity + data[i].details.articles[k].quantity
                    }
                }
                if (!articleWasBeenFound) {
                    articlesList.push({
                        itemId: data[i].details.articles[k].itemId,
                        name: data[i].details.articles[k].name,
                        quantity: data[i].details.articles[k].quantity,
                    })
                }

            }

        }
    }
    articlesList.sort(function (a, b) {
        return a.quantity.localeCompare(b.quantity);
    });
    return articlesList
}
async function clientByRevenue(data) {
    let clientsList = []

    for (let i = 0; i < data.length; i++) {

        if (!isCancelled(data[i].details)) {
            let myClient = await strapi.services.client.findOne({ id: data[i].client })

            let clientWasBeenFound = false
            for (let j = 0; j < clientsList.length; j++) {
                if (clientsList[j].client == data[i].client) {
                    clientWasBeenFound = true
                    clientsList[j].revenue = clientsList[j].revenue + data[i].details.subTotal * 1.2
                }
            }
            if (!clientWasBeenFound) {
                clientsList.push({
                    client: data[i].client,
                    name: myClient.companyDetails.knowenName + " - " + myClient.companyDetails.address[0].city,
                    revenue: data[i].details.subTotal * 1.2
                })
            }
        }
    }
    clientsList.sort(function (a, b) {
        return a.revenue.localeCompare(b.revenue);
    });

    return clientsList

}

function totalRevenue(invoices) {
    let projectedRevenue = 0
    let tobePaid = 0
    for (let i = 0; i < invoices.length; i++) {
        if (isProjectedRevenue(invoices[i])) {
            projectedRevenue = projectedRevenue + invoices[i].total
            if (isToBePaid(invoices[i])) {
                tobePaid = tobePaid + invoices[i].total
            }
        }
    }
    return {

        projectedRevenue: projectedRevenue,
        tobePaid: tobePaid

    }
}

function isActive(detail) {
    let isValidated = false
    let isClosed = false
    for (let i = 0; i < detail.status.length; i++) {
        if (detail.status[i].name == "validated") {
            isValidated = true
        }
        else if (detail.status[i].name == "closed") {
            isClosed = true
        }
    }
    if (isValidated && !isClosed) {
        return true
    }
    else {
        return false
    }
}

function isCancelled(detail) {
    let isCancelled = false
    for (let i = 0; i < detail.status.length; i++) {
        if (detail.status[i].name == "cancelled") {
            isCancelled = true
        }
    }
    if (isCancelled) {
        return true
    }
    else {
        return false
    }
}

function isProjectedRevenue(detail) {
    let isCancelled = false
    for (let i = 0; i < detail.status.length; i++) {
        if (detail.status[i].name == "cancelled") {
            isCancelled = true
        }
    }
    if (!isCancelled) {
        return true
    }
    else {
        return false
    }
}

function isToBePaid(detail) {
    let isNot = false
    let isValidated = false
    for (let i = 0; i < detail.status.length; i++) {
        if (detail.status[i].name == "cancelled" || detail.status[i].name == "closed" || detail.status[i].name == "paid") {
            isNot = true
        }
        if (detail.status[i].name == "validated") {
            isValidated = true
        }
    }
    if (!isNot & isValidated) {
        return true
    }
    else {
        return false
    }
}


function calculateOrders(detail) {
    let activeOrders = 0
    let allOrders = 0
    for (let i = 0; i < detail.length; i++) {
        allOrders = allOrders + 1
        let isNot = false

        for (let j = 0; j < detail[i].details.status.length; j++) {
            
            if (detail[i].details.status[j].name == "cancelled" || detail[i].details.status[j].name == "closed") {
                isNot = true
            }
        }
        if (!isNot) {
            activeOrders = activeOrders + 1
        }

    }
    return {
        allOrders: allOrders,
        activeOrders: activeOrders
    }
}