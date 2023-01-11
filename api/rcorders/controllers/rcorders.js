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
var addMinutes = require('date-fns/addMinutes')
/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

module.exports = {
    async getOneRcProduct(ctx) {
        const { productId, spId, rcEmployee } = ctx.params;
        let sp = await strapi.services.restauration.findOne({
            id: spId
        });
        let tax = await strapi.services.generalsettingsdefaults.find();
        console.log(tax.tvaRestaurationRc);


        let oneProduct
        for (let i = 0; i < sp.items.length; i++) {
            if (sp.items[i].id == productId) {
                oneProduct = sp.items[i]
            }
        }
        let myProduct
        let specs = []
        for (let i = 0; i < oneProduct.specification.length; i++) {
            specs.push(oneProduct.specification[i].specText)
        }
        let realPrice
        let oldPrice
        if (oneProduct.disocunt) {
            oneProduct.disocunt = parseInt(oneProduct.disocunt.percentage)
            oldPrice = oneProduct.price * (1 + tax.tvaRestaurationRc / 100)
            oldPrice = parseFloat(oldPrice.toFixed(2))
            realPrice = (oneProduct.price - oneProduct.price * (oneProduct.disocunt / 100)) * (1 + tax.tvaRestaurationRc / 100)
            realPrice = parseFloat(realPrice.toFixed(2))
        } else {
            realPrice = oneProduct.price * (1 + tax.tvaRestaurationRc / 100)
            realPrice = parseFloat(realPrice.toFixed(2))
        }
        let images = []
        if (oneProduct.images) {
            for (let j = 0; j < oneProduct.images.length; j++) {
                images.push(oneProduct.images[j].url)
            }
        }
        if (oneProduct) {
            myProduct = {
                name: oneProduct.name,
                realPrice: realPrice,
                oldPrice: oldPrice,
                specs: specs,
                rating: sp.ratingTotal,
                description: oneProduct.description,
                firstImage: oneProduct.firstImage ? oneProduct.firstImage.url : null,
                images: images,
                spId: sp.id,
                productId: productId,
                spName: sp.knownName,
                category: oneProduct.categories[0].name,
            }
        }
        return myProduct
    },
    async controlOrderItems(ctx) {
        try {
            const { productId, spId, rcEmployee, quantity } = ctx.params;
            console.log(productId);
            console.log(spId);
            console.log(rcEmployee);
            console.log(quantity);
            let sp = await strapi.services.restauration.findOne({
                id: spId
            });
            let requestItem
            for (let p = 0; p < sp.items.length; p++) {
                if (sp.items[p].id == productId) {
                    requestItem = sp.items[p]
                }
            }
            let tax = await strapi.services.generalsettingsdefaults.find();
            console.log(tax.tvaRestaurationRc);
            let rcEmployeeOrders = await strapi.services.rcorders.find({
                rcemployee: rcEmployee
            });
            let profile = await strapi.services.rcemployees.findOne({
                id: rcEmployee
            });
            rcEmployeeOrders.reverse()
            let activeOrder
            for (let i = 0; i < rcEmployeeOrders.length; i++) {
                let onlyDraft = true
                for (let j = 0; j < rcEmployeeOrders[i].status.length; j++) {
                    if (rcEmployeeOrders[i].status[j].name != "draft") {
                        onlyDraft = false
                        break
                    }
                }
                if (onlyDraft) {
                    activeOrder = rcEmployeeOrders[i]
                    break
                }
            }
            if (activeOrder) {
                return "Already"
            } else {
                let scheduledDate = new Date()
                scheduledDate = addMinutes(scheduledDate, 30)
                let newOrder = {
                    number: (rcEmployeeOrders.length + 1).toString(),
                    items: [],
                    status: [{
                        status: "draft",
                        added: new Date(),
                    }],
                    scheduledDate: scheduledDate,
                    employeeToPay: null,
                    paymentMethod: null,
                    rcemployee: profile.id,
                    address: {
                        street: profile.address.street,
                        country: profile.address.country,
                        lat: null,
                        long: null,
                    },
                    subTotal: null,
                    tax: null,
                    shippingFees: null,
                    total: null
                }
                // requestItem
                let itemUP = requestItem.disocunt ? requestItem.price * (1 - parseInt(requestItem.disocunt.percentage) / 100) : requestItem.price
                let myItem = {
                    itemId: requestItem.id,
                    quantity: quantity,
                    up: itemUP,
                    itemName: requestItem.name,
                    photoUrl: requestItem.firstImage ? requestItem.firstImage.url : null,
                    sp: spId,
                    subTotal: itemUP * quantity
                }
                newOrder.items.push(myItem)
                let myShippingFees = 0
                newOrder.shippingFees = myShippingFees
                newOrder.subTotal = myItem.subTotal + myShippingFees
                newOrder.tax = myItem.subTotal * (tax.tvaRestaurationRc / 100)
                newOrder.total = newOrder.tax + newOrder.subTotal
                // TODO employeeToPay , paymentMethod , lat long , 
                let profileOrders = await strapi.services.rcorders.find({ rcemployee: rcEmployee });
                let totalOrdersDaily = 0
                let totalOrdersMonthly = 0
                let howMuchTheCompanyWillPayDaily = 0
                let howMuchTheCompanyWillPayMonthly = 0
                for (let k = 0; k < profileOrders.length; k++) {
                    if (isToday(profileOrders[k].scheduledDate)) {
                        totalOrdersDaily = totalOrdersDaily + profileOrders[K].total
                        howMuchTheCompanyWillPayDaily = howMuchTheCompanyWillPayDaily +
                            profileOrders[K].total - profileOrders[k].employeeToPay

                    }
                    if (isThisMonth(profileOrders[k].scheduledDate)) {
                        totalOrdersMonthly = totalOrdersMonthly + profileOrders[K].total
                        howMuchTheCompanyWillPayMonthly = howMuchTheCompanyWillPayMonthly +
                            profileOrders[K].total - profileOrders[k].employeeToPay
                    }
                }
                let balanceRemainingDaily = 0
                let balanceRemainingMonthly = 0
                if (profile.dotation.monthlyLimit > howMuchTheCompanyWillPayMonthly) {
                    balanceRemainingMonthly = profile.dotation.monthlyLimit - howMuchTheCompanyWillPayMonthly
                    if (profile.dotation.dailyLimit > howMuchTheCompanyWillPayDaily) {
                        balanceRemainingDaily = profile.dotation.dailyLimit - howMuchTheCompanyWillPayDaily
                    } else {
                        balanceRemainingDaily = 0
                    }
                } else {
                    balanceRemainingMonthly = 0
                    balanceRemainingDaily = 0
                }
                console.log(balanceRemainingMonthly);
                console.log(balanceRemainingDaily);
                if (balanceRemainingMonthly > 0) {
                    if (balanceRemainingDaily > 0) {
                        newOrder.employeeToPay = newOrder.total - balanceRemainingDaily
                    } else {
                        newOrder.employeeToPay = newOrder.total
                    }
                } else {
                    newOrder.employeeToPay = newOrder.total
                }
                console.log("balanceRemainingMonthly: "+balanceRemainingMonthly);
                console.log("balanceRemainingDaily: "+balanceRemainingDaily);
                console.log("newOrder.employeeToPay: "+newOrder.employeeToPay);

                if (newOrder.employeeToPay < 0) {
                    newOrder.employeeToPay = 0
                }
                if (profile.dotation.cotisation > 0 && (newOrder.employeeToPay / newOrder.total)*100 < profile.dotation.cotisation) {
                    newOrder.employeeToPay = newOrder.total * profile.dotation.cotisation / 100
                }
                let newCreatedOrder = await strapi.services.rcorders.create(newOrder);
                return newCreatedOrder
            }
        } catch (error) {
            console.log(error);
        }

    },
    async extractKpi(ctx) {
        try {
            const orders = await strapi.services.rcorders.find();
            const totalOrdersValue = orders.reduce((acc, cur) => acc + cur.total, 0);
            const averageOrderValue = totalOrdersValue / orders.length;
            const minOrderValue = Math.min(...orders.map(order => order.total));
            const maxOrderValue = Math.max(...orders.map(order => order.total));

            const employeeOrders = {};
            for (let i = 0; i < orders.length; i++) {
                const employeeId = orders[i].rcemployee;
                if (!employeeOrders[employeeId]) {
                    employeeOrders[employeeId] = {
                        id: employeeId,
                        nbOfOrder: 0,
                        totalOrders: 0
                    }
                }
                employeeOrders[employeeId].nbOfOrder++;
                employeeOrders[employeeId].totalOrders += orders[i].total;
            }

            console.log(`Total value of orders: ${totalOrdersValue}`);
            console.log(`Average value of an order: ${averageOrderValue}`);
            console.log(`Minimum value of an order: ${minOrderValue}`);
            console.log(`Maximum value of an order: ${maxOrderValue}`);
            console.log(`Employee Orders: ${JSON.stringify(Object.values(employeeOrders))}`);
            return { totalOrdersValue, averageOrderValue, minOrderValue, maxOrderValue, employeeOrders: Object.values(employeeOrders) }
        } catch (err) {
            console.error(err);
        }
    }

};


//#6A33CD
//L'article a été ajouté au panier.