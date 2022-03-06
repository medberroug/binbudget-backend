'use strict';
const { sanitizeEntity } = require('strapi-utils');
/**
 * Cron config that gives you an opportunity
 * to run scheduled jobs.
 *
 * The cron format consists of:
 * [SECOND (optional)] [MINUTE] [HOUR] [DAY OF MONTH] [MONTH OF YEAR] [DAY OF WEEK]
 *
 * See more details here: https://strapi.io/documentation/developer-docs/latest/setup-deployment-guides/configurations.html#cron-tasks
 */

module.exports = {
  /**
   * Simple example.
   * Every monday at 1am.
   */
  '0 * * * *': async () => {
    let entitiesEvents;
  
    entitiesEvents = await strapi.services.events.find();
    let events = entitiesEvents.map(entity => sanitizeEntity(entity, { model: strapi.models.events }));
    let serviceProviders = await strapi.services.eventserviceprovider.find()
    serviceProviders = serviceProviders.map(entity => sanitizeEntity(entity, { model: strapi.models.eventserviceprovider }));
    let myBigResults = []
    for (let m = 0; m < serviceProviders.length; m++) {
      let eventOrderDetails = []
      for (let i = 0; i < events.length; i++) {
        for (let j = 0; j < events[i].eventOrderDetails.length; j++) {
          if (events[i].eventOrderDetails[j].eventServiceProvider == serviceProviders[m].id) {
            eventOrderDetails.push({
              client: events[i].byClient,
              details: events[i].eventOrderDetails[j]
            })
          }
        }
      }
      let entitiesInvoices
      let myInvoices
      entitiesInvoices = await strapi.services.invoice.find({ withTypeId: serviceProviders[m].id });
      myInvoices = entitiesInvoices.map(entity => sanitizeEntity(entity, { model: strapi.models.invoice }));
      let result = {
        serviceProvider: serviceProviders[m].id,
        clientByRevenue: await clientByRevenue(eventOrderDetails),
        topSellingProducts: topSellingProduct(eventOrderDetails),
        totalRevenue: totalRevenue(myInvoices),
        calculateOrders: calculateOrders(eventOrderDetails)
      }
      myBigResults.push(result)
    }
    for (let p=0; p<myBigResults.length;p++){
      strapi.services.statistics.create(myBigResults[p])
    }
    // strapi.services.invoice.create(myInvoiceAchat)
    // console.log(myBigResults);
  }
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
    return a.revenue.localeCompare(b.quantity);
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