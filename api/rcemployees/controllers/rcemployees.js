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
    async getUserProfile(ctx) {
        const { id } = ctx.params;
        let rcEmployee = await strapi.services.rcemployees.findOne({
            id: id
        });
        let rcOrders = await strapi.services.rcorders.find({
            rcemployee: id
        });
        let remainingDaily = rcEmployee.dotation.dailyLimit
        let remainingMonthly = rcEmployee.dotation.monthlyLimit
        for ( let i=0; i<rcOrders.length;i++){
            if(isToday(rcOrders.scheduledDate)){
                remainingDaily = remainingDaily - rcOrders*(1-rcEmployee.dotation.cotisation/100)
            }
            if (isThisMonth(rcOrders.scheduledDate)){
                remainingMonthly = remainingMonthly - rcOrders*(1-rcEmployee.dotation.cotisation/100)
            }
        }
        console.log(rcEmployee.dotation.cotisation);
        let cotisation  = rcEmployee.dotation.cotisation + "% Salarié + " + (100 - rcEmployee.dotation.cotisation) + "% Entreprise"
        let today = new Date()
        let accountCreatedDate = formatDistance(today, rcEmployee.createdAt, {
            locale: eoLocale
          })
        
        let myEmployee = {
            id: id,
            firstName: rcEmployee.firstName,
            lastName: rcEmployee.lastName,
            phone : rcEmployee.phone,
            photo: rcEmployee.photo ? rcEmployee.photo.url : "/uploads/user_Image_d2302d4928.jpeg?37490023.600000024",
            dotation: {
                cotisation: cotisation,
                dailyLimit: 0,
                monthlyLimit: 0,
                remainingDaily : remainingDaily,
                remainingMonthly : remainingMonthly
            },
            companyName: rcEmployee.company.companyDetails.knowenName,
            status: rcEmployee.status,
            walletBalance : rcEmployee.walletBalance,
            accountCreatedDate: accountCreatedDate,
            address : {
                street : rcEmployee.address.street,
                country : rcEmployee.address.country,
                district : rcEmployee.address.district
            }
        }
        return myEmployee

    },

    // XXXXXXXX

};
