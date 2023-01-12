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
        let totalOrdersDaily = 0
        let totalOrdersMonthly = 0
        let howMuchEmployeePaidDaily = 0
        let howMuchEmployeePaidMonthly = 0
        for (let i = 0; i < rcOrders.length; i++) {
            if (isToday(rcOrders[i].scheduledDate)) {
                remainingDaily = remainingDaily - rcOrders[i].employeeToPay
                totalOrdersDaily = totalOrdersDaily + rcOrders[i].total
                howMuchEmployeePaidDaily = howMuchEmployeePaidDaily + rcOrders[i].employeeToPay
            }
            if (isThisMonth(rcOrders[i].scheduledDate)) {
                remainingMonthly = remainingMonthly - rcOrders[i].employeeToPay
                totalOrdersMonthly = totalOrdersMonthly + rcOrders[i].total
                howMuchEmployeePaidMonthly = howMuchEmployeePaidMonthly + rcOrders[i].employeeToPay
            }
        }
        let howMuchTheCompanyPaidDaily = totalOrdersDaily - howMuchEmployeePaidDaily
        let howMuchTheCompanyPaidMonthly = totalOrdersMonthly - howMuchEmployeePaidMonthly
        console.log(rcEmployee.dotation.cotisation);
        let cotisation = rcEmployee.dotation.cotisation + "% Salarié + " + (100 - rcEmployee.dotation.cotisation) + "% Entreprise"
        let today = new Date()
        let accountCreatedDate = formatDistance(today, rcEmployee.createdAt, {
            locale: eoLocale
        })
        let dotationRequests = await strapi.services.dotationraiserequests.find({ rcemployee: rcEmployee.id });
        let dotationPendingNotFound = true
        for (let i = 0; i < dotationRequests.length; i++) {
            let finishedRequest = false
            for (let j = 0; j < dotationRequests[i].status.length; j++) {
                if (dotationRequests[i].status[j].name == "finished") {
                    finishedRequest = true
                }
            }
            if (!finishedRequest) {
                dotationPendingNotFound = false
            }
        }
        let dailyText = ((howMuchTheCompanyPaidDaily / rcEmployee.dotation.dailyLimit) * 100) + "% (" + howMuchTheCompanyPaidDaily + " DH/" + rcEmployee.dotation.dailyLimit + " DH)"
        let monthlyText = ((howMuchTheCompanyPaidMonthly / rcEmployee.dotation.monthlyLimit) * 100) + "% (" + howMuchTheCompanyPaidMonthly + " DH/" + rcEmployee.dotation.monthlyLimit + " DH)"
        let myEmployee = {
            id: id,
            firstName: rcEmployee.firstName,
            lastName: rcEmployee.lastName,
            phone: rcEmployee.phone,
            photo: rcEmployee.photo ? rcEmployee.photo.url : "/uploads/user_Image_d2302d4928.jpeg?37490023.600000024",
            dotation: {
                cotisation: cotisation,
                dailyLimit: rcEmployee.dotation.dailyLimit,
                monthlyLimit: rcEmployee.dotation.monthlyLimit,
                remainingDaily: remainingDaily,
                remainingMonthly: remainingMonthly,
                dailyText: dailyText,
                monthlyText: monthlyText,
                dailyProgress: 1 - remainingDaily / rcEmployee.dotation.dailyLimit,
                monthlyProgress: 1 - remainingMonthly / rcEmployee.dotation.monthlyLimit
            },
            canRequestMoreDotation: rcEmployee.canRequestMoreDotation,
            companyName: rcEmployee.company.companyDetails.knowenName,
            dotationPendingNotFound: dotationPendingNotFound,
            status: rcEmployee.status,
            walletBalance: rcEmployee.walletBalance,
            accountCreatedDate: accountCreatedDate,
            address: {
                street: rcEmployee.address.street,
                country: rcEmployee.address.country,
                district: rcEmployee.address.district
            }
        }
        return myEmployee

    },



    // XXXXXXXX

};
