'use strict';
const { parseMultipartData, sanitizeEntity } = require('strapi-utils');
var eoLocale = require('date-fns/locale/fr')
var add = require('date-fns/add')
var isToday = require('date-fns/isToday')
var format = require('date-fns/format')
var lastDayOfMonth = require('date-fns/lastDayOfMonth')
var isBefore = require('date-fns/isBefore')
var isAfter = require('date-fns/isAfter')
var formatDistance = require('date-fns/formatDistance')
var isThisMonth = require('date-fns/isThisMonth')
/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

module.exports = {
    async addNewDotationRequest(ctx) {
        // ctx.request.body
        let data = ctx.request.body
        let newRequest  = {
            desiredDailyAmount : data.desiredDailyAmount,
            desiredMonthlyLimit : data.desiredMonthlyLimit,
            arguments: data.arguments,
            desiredEmployeeCotisation: data.desiredEmployeeCotisation,
            status : [{
                date : new Date(),
                name: "created",
                comment : "La demande a été envoyée par le salarié, en attendant le retour de l'employeur."

            }],
            rcemployee :  data.rcemployee,
        }
        let result = await strapi.services.dotationraiserequests.create(newRequest);
        return true
    },
};
