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
var isThisWeek = require('date-fns/isThisWeek')
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
    async itemAlreadyExistInCart(ctx) {
        const { productId, spId, rcEmployee } = ctx.params;
        let sp = await strapi.services.restauration.findOne({
            id: spId
        });
        let oneProduct
        for (let i = 0; i < sp.items.length; i++) {
            if (sp.items[i].id == productId) {
                oneProduct = sp.items[i]
            }
        }
        let rcEmployeeOrders = await strapi.services.rcorders.find({
            rcemployee: rcEmployee
        });
        let activeOrder
        for (let i = 0; i < rcEmployeeOrders.length; i++) {
            let onlyDraft = true
            for (let j = 0; j < rcEmployeeOrders[i].status.length; j++) {
                console.log("Checking Order : " + rcEmployeeOrders[i].number);
                if (rcEmployeeOrders[i].status[j].status != "draft") {
                    onlyDraft = false
                    console.log("Order is not Pending : " + rcEmployeeOrders[i].number);
                    break
                }
            }
            if (onlyDraft) {
                console.log("Order is Pending :" + rcEmployeeOrders[i].number);
                activeOrder = rcEmployeeOrders[i]
                break
            }
        }
        if (activeOrder) {
            for (let i = 0; i < activeOrder.items.length; i++) {
                if (activeOrder.items[i].itemId == productId && activeOrder.items[i].sp == spId) {
                    return [true, "Déjà ajouté au panier."]
                }
            }
            for (let i = 0; i < activeOrder.items.length; i++) {
                if (activeOrder.items[i].sp != spId) {
                    return [true, "la commande en vigueur ne peut provenir que d'un seul restaurateur"]

                }
            }
        }

        return [false, "Not Added"]
    },
    async activeOrder(ctx) {
        const { rcEmployee } = ctx.params;
        let rcEmployeeOrders = await strapi.services.rcorders.find({
            rcemployee: rcEmployee
        });
        let activeOrder
        for (let i = 0; i < rcEmployeeOrders.length; i++) {
            let onlyDraft = true
            for (let j = 0; j < rcEmployeeOrders[i].status.length; j++) {
                if (rcEmployeeOrders[i].status[j].status != "draft") {
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
            return [true, activeOrder]
        }

        return [false, "No Active Orders"]
    },
    async changeOrderStatus(ctx) {
        const { orderId, newStatus } = ctx.params;
        let order = await strapi.services.rcorders.findOne({
            id: orderId
        });
        if (newStatus == "created") {
            let newStatus = {
                added: new Date(),
                status: "created"
            }
            order.status.push(newStatus)
            let now = new Date()
            order.scheduledDate = addMinutes(now, 30)
        }
        let newList = []
        for (let i = 0; i < order.status.length; i++) {
            newList.push({
                added: order.status[i].added,
                status: order.status[i].status
            })
        }

        let NewOrder = await strapi.services.rcorders.update({
            id: orderId
        }, {
            status: newList,
            scheduledDate: order.scheduledDate
        });
        return NewOrder
    },
    async getProposedShippingTime(ctx) {
        const { rcEmployee } = ctx.params;
        let rcEmployeeOrders = await strapi.services.rcorders.find({
            rcemployee: rcEmployee
        });
        let activeOrder
        for (let i = 0; i < rcEmployeeOrders.length; i++) {
            let onlyDraft = true
            for (let j = 0; j < rcEmployeeOrders[i].status.length; j++) {
                if (rcEmployeeOrders[i].status[j].status != "draft") {
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
            let startHour = new Date()
            startHour = addMinutes(startHour, 30)
            let endHour = new Date()
            endHour = addMinutes(endHour, 60)
            let formatedDate = format(startHour, "EEEE d LLL yyyy - HH:mm", {
                locale: eoLocale
            }) + format(endHour, " 'et' HH:mm", {
                locale: eoLocale
            })

            return { date: formatedDate }
        }

        return [false, "No Active Orders"]
    },
    async getRcEmployeeOrders(ctx) {
        const { rcEmployee } = ctx.params;
        let rcEmployeeOrders = await strapi.services.rcorders.find({
            rcemployee: rcEmployee
        });
        let pendingOrders = []
        let closedOrders = []

        for (let i = 0; i < rcEmployeeOrders.length; i++) {
            for (let j = 0; j < rcEmployeeOrders[i].status.length; j++) {
                if (rcEmployeeOrders[i].status[j].status == "closed" || rcEmployeeOrders[i].status[j].status == "notValidated"
                    || rcEmployeeOrders[i].status[j].status == "cancelled") {
                    let spName = await strapi.services.restauration.findOne({
                        id: rcEmployeeOrders[i].items[0].sp
                    });
                    spName = spName.knownName
                    let myStatus
                    let latestStatus = rcEmployeeOrders[i].status[rcEmployeeOrders[i].status.length - 1].status
                    if (latestStatus == "cancelled") {
                        myStatus = "Annulé"
                    } else if (latestStatus == "notValidated") {
                        myStatus = "Annulé"
                    } else if (latestStatus == "closed") {
                        myStatus = "Clôturé"
                    }
                    let myClosedOrder = {
                        id: rcEmployeeOrders[i].id,
                        number: rcEmployeeOrders[i].number,
                        spName: spName,
                        employeeToPay: rcEmployeeOrders[i].employeeToPay,
                        status: myStatus
                    }
                    if (myStatus ) {
                        closedOrders.push(myClosedOrder)
                    }

                }
            }
        }
        for (let i = 0; i < rcEmployeeOrders.length; i++) {
            let itsClosed = false
            for (let j = 0; j < closedOrders.length; j++) {
                if (closedOrders[j].id == rcEmployeeOrders[i].id) {
                    itsClosed = true
                    break
                }
            }
            if (!itsClosed) {
                let spName = await strapi.services.restauration.findOne({
                    id: rcEmployeeOrders[i].items[0].sp
                });
                spName = spName.knownName
                let myStatus
                let latestStatus = rcEmployeeOrders[i].status[rcEmployeeOrders[i].status.length - 1].status
                if (latestStatus == "created") {
                    myStatus = "En cours"
                } else if (latestStatus == "preparationFinished") {
                    myStatus = "En cours"
                } else if (latestStatus == "deliveryTookOrder") {
                    myStatus = "En cours"
                } else if (latestStatus == "shipped") {
                    myStatus = "Livré"
                }

                let myPendingOrder = {
                    id: rcEmployeeOrders[i].id,
                    number: rcEmployeeOrders[i].number,
                    spName: spName,
                    employeeToPay: rcEmployeeOrders[i].employeeToPay,
                    status: myStatus
                }
                if (myStatus) {
                    pendingOrders.push(myPendingOrder)
                }

            }
        }


        pendingOrders.reverse()
        closedOrders.reverse()
        let pendingExist = false
        let closedExist = false
        if (pendingOrders.length > 0) {
            pendingExist = true
        }
        if (closedOrders.length > 0) {
            closedExist = true
        }
        return [pendingOrders, closedOrders, pendingExist, closedExist]
    },
    async getOneOrderPending(ctx) {
        const { orderId } = ctx.params;
        let order = await strapi.services.rcorders.findOne({
            id: orderId
        });
        let myStatus
        let latestStatus = order.status[order.status.length - 1].status
        if (latestStatus == "created") {
            myStatus = "En cours"
        } else if (latestStatus == "preparationFinished") {
            myStatus = "En cours"
        } else if (latestStatus == "deliveryTookOrder") {
            myStatus = "En cours"
        } else if (latestStatus == "shipped") {
            myStatus = "Livré"
        } else if (latestStatus == "cancelled") {
            myStatus = "Annulé"
        } else if (latestStatus == "notValidated") {
            myStatus = "Annulé"
        } else if (latestStatus == "closed") {
            myStatus = "Clôturé"
        }
        let startHour = order.scheduledDate
        let endHour = order.scheduledDate
        endHour = addMinutes(endHour, 30)
        let formatedDate = format(startHour, "EEEE d LLL yyyy - HH:mm", {
            locale: eoLocale
        }) + format(endHour, " 'et' HH:mm", {
            locale: eoLocale
        })
        let deliveryoperator
        if (order.deliveryoperator) {
            deliveryoperator = await strapi.services.deliveryoperators.findOne({
                id: order.deliveryoperator
            });
        }
        let myOrder = {
            id: order.id,
            number: order.number,
            items: order.items,
            status: myStatus,
            subTotal: order.subTotal,
            tax: order.tax,
            total: order.total,
            shippingFees: order.shippingFees,
            address: order.address,
            employeeToPay: order.employeeToPay,
            rcemployee: order.rcEmployee,
            scheduledDate: formatedDate,
            deliveryoperator: deliveryoperator
        }
        return myOrder
    },
    async getOneClosedPending(ctx) {
        const { orderId } = ctx.params;
        let order = await strapi.services.rcorders.findOne({
            id: orderId
        });
        let myStatus
        let latestStatus = order.status[order.status.length - 1].status
        if (latestStatus == "created") {
            myStatus = "En cours"
        } else if (latestStatus == "preparationFinished") {
            myStatus = "En cours"
        } else if (latestStatus == "deliveryTookOrder") {
            myStatus = "En cours"
        } else if (latestStatus == "shipped") {
            myStatus = "Livré"
        } else if (latestStatus == "cancelled") {
            myStatus = "Annulé"
        } else if (latestStatus == "notValidated") {
            myStatus = "Annulé"
        } else if (latestStatus == "closed") {
            myStatus = "Clôturé"
        }
        for (let k = 0; k < order.status.length; k++) {
            if (order.status[k].status == "shipped") {
                order.scheduledDate = order.status[k].added
            }
        }
        let startHour = order.scheduledDate
        let formatedDate = format(startHour, "EEEE d LLL yyyy - HH:mm", {
            locale: eoLocale
        })
        let deliveryoperator
        if (order.deliveryoperator) {
            deliveryoperator = await strapi.services.deliveryoperators.findOne({
                id: order.deliveryoperator
            });
        }
        let myOrder = {
            id: order.id,
            number: order.number,
            items: order.items,
            status: myStatus,
            subTotal: order.subTotal,
            tax: order.tax,
            total: order.total,
            shippingFees: order.shippingFees,
            address: order.address,
            employeeToPay: order.employeeToPay,
            rcemployee: order.rcEmployee,
            scheduledDate: formatedDate,
            deliveryoperator: deliveryoperator
        }
        return myOrder
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
                    console.log("Checking Order : " + rcEmployeeOrders[i].number);
                    if (rcEmployeeOrders[i].status[j].status != "draft") {
                        onlyDraft = false
                        console.log("Order is not Pending : " + rcEmployeeOrders[i].number);
                        break
                    }
                }
                if (onlyDraft) {
                    console.log("Order is Pending :" + rcEmployeeOrders[i].number);
                    activeOrder = rcEmployeeOrders[i]
                    break
                }
            }
            console.log(activeOrder);
            if (activeOrder) {
                let newOrder = activeOrder
                let itemUP = requestItem.disocunt ? requestItem.price * (1 - parseInt(requestItem.disocunt.percentage) / 100) : requestItem.price
                let myItem = {
                    itemId: requestItem.id,
                    quantity: quantity,
                    up: itemUP,
                    itemName: requestItem.name,
                    photoURL: requestItem.firstImage.url,
                    sp: spId,
                    subTotal: itemUP * quantity
                }
                newOrder.items.push(myItem)
                newOrder.subTotal = newOrder.subTotal + myItem.subTotal
                newOrder.tax = newOrder.subTotal * (tax.tvaRestaurationRc / 100)
                newOrder.total = newOrder.tax + newOrder.subTotal
                let profileOrders = await strapi.services.rcorders.find({ rcemployee: rcEmployee });
                let totalOrdersDaily = 0
                let totalOrdersMonthly = 0
                let howMuchTheCompanyWillPayDaily = 0
                let howMuchTheCompanyWillPayMonthly = 0
                for (let m = 0; m<profileOrders.length; m++) {
                    if (profileOrders[m].id == newOrder.id) {
                        profileOrders.splice(m, 1)
                    }
                }
                for (let k = 0; k < profileOrders.length; k++) {
                    if (isToday(profileOrders[k].scheduledDate)) {
                        totalOrdersDaily = totalOrdersDaily + profileOrders[k].total
                        howMuchTheCompanyWillPayDaily = howMuchTheCompanyWillPayDaily +
                            profileOrders[k].total - profileOrders[k].employeeToPay

                    }
                    if (isThisMonth(profileOrders[k].scheduledDate)) {
                        totalOrdersMonthly = totalOrdersMonthly + profileOrders[k].total
                        howMuchTheCompanyWillPayMonthly = howMuchTheCompanyWillPayMonthly +
                            profileOrders[k].total - profileOrders[k].employeeToPay
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
                if (newOrder.employeeToPay < 0) {
                    newOrder.employeeToPay = 0
                }
                if (profile.dotation.cotisation > 0 && (newOrder.employeeToPay / newOrder.total) * 100 < profile.dotation.cotisation) {
                    newOrder.employeeToPay = newOrder.total * profile.dotation.cotisation / 100
                }

                let newItems = []
                for (let p = 0; p < newOrder.items.length; p++) {
                    newItems.push({
                        itemId: newOrder.items[p].itemId,
                        quantity: newOrder.items[p].quantity,
                        up: newOrder.items[p].up,
                        itemName: newOrder.items[p].itemName,
                        photoURL: newOrder.items[p].photoURL,
                        sp: newOrder.items[p].sp,
                        subTotal: newOrder.items[p].subTotal,
                    })
                }
                let newUpdatedOrder = await strapi.services.rcorders.update({
                    id: newOrder.id
                }, {
                    items: newItems,
                    subTotal: newOrder.subTotal,
                    tax: newOrder.tax,
                    total: newOrder.total,
                    employeeToPay: newOrder.employeeToPay
                });
                return newUpdatedOrder
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
                    photoURL: requestItem.firstImage.url,
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
                        totalOrdersDaily = totalOrdersDaily + profileOrders[k].total
                        howMuchTheCompanyWillPayDaily = howMuchTheCompanyWillPayDaily +
                            profileOrders[k].total - profileOrders[k].employeeToPay

                    }
                    if (isThisMonth(profileOrders[k].scheduledDate)) {
                        totalOrdersMonthly = totalOrdersMonthly + profileOrders[k].total
                        howMuchTheCompanyWillPayMonthly = howMuchTheCompanyWillPayMonthly +
                            profileOrders[k].total - profileOrders[k].employeeToPay
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
                if (newOrder.employeeToPay < 0) {
                    newOrder.employeeToPay = 0
                }
                if (profile.dotation.cotisation > 0 && (newOrder.employeeToPay / newOrder.total) * 100 < profile.dotation.cotisation) {
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
    },


    async extractKpi2() {
        // Fetch all rcOrders from the database
        const rcOrders = await strapi.services.rcorders.find();

        // Group orders by employee
        const employeeOrders = rcOrders.reduce((acc, order) => {
            if (!acc[order.rcemployee]) {
                acc[order.rcemployee] = {
                    id: order.rcemployee,
                    orders: [],
                    totalValue: 0,
                    avgValue: 0,
                    minValue: Number.MAX_SAFE_INTEGER,
                    maxValue: Number.MIN_SAFE_INTEGER,
                };
            }

            acc[order.rcemployee].orders.push(order);
            acc[order.rcemployee].totalValue += order.total;
            acc[order.rcemployee].minValue = Math.min(acc[order.rcemployee].minValue, order.total);
            acc[order.rcemployee].maxValue = Math.max(acc[order.rcemployee].maxValue, order.total);

            return acc;
        }, {});

        // Compute average value
        Object.values(employeeOrders).forEach(employee => {
            employee.avgValue = employee.totalValue / employee.orders.length;
        });

        return Object.values(employeeOrders);
    },
    async extractKpi3(ctx) {
        let rcOrders = await strapi.services.rcorders.find();
        let kpi = {
            datetime: new Date(),
            frequencyOfOrders: {
                daily: 0,
                weekly: 0,
                monthly: 0,
                allTime: 0,
            },
            itemsOrders: [],
            howMuchEmployeePaidTotal: 0,
            howMuchEmployeePaidAvg: 0,
            howManyOrdersEmployeeCancelled: 0
        };

        // Get frequency of orders
        for (let i = 0; i < rcOrders.length; i++) {
            kpi.frequencyOfOrders.allTime++;
            if (isToday(rcOrders[i].scheduledDate)) {
                kpi.frequencyOfOrders.daily++;
            }
            if (isThisWeek(rcOrders[i].scheduledDate)) {
                kpi.frequencyOfOrders.weekly++;
            }
            if (isThisMonth(rcOrders[i].scheduledDate)) {
                kpi.frequencyOfOrders.monthly++;
            }
        }

        // Get itemsOrders
        for (let i = 0; i < rcOrders.length; i++) {
            for (let j = 0; j < rcOrders[i].items.length; j++) {
                let found = false;
                for (let k = 0; k < kpi.itemsOrders.length; k++) {
                    if (kpi.itemsOrders[k].itemId === rcOrders[i].items[j].itemId) {
                        kpi.itemsOrders[k].quantity += rcOrders[i].items[j].quantity;
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    kpi.itemsOrders.push({ itemId: rcOrders[i].items[j].itemId, quantity: rcOrders[i].items[j].quantity });
                }
            }
        }

        // Get howMuchEmployeePaidTotal and howManyOrdersEmployeeCancelled
        for (let i = 0; i < rcOrders.length; i++) {
            if (rcOrders[i].employeeToPay) {
                kpi.howMuchEmployeePaidTotal += rcOrders[i].employeeToPay;
            }
            for (let j = 0; j < rcOrders[i].status.length; j++) {
                if (rcOrders[i].status[j].status === "cancelledByEmployee") {
                    kpi.howManyOrdersEmployeeCancelled++;
                    break;
                }
            }
        }

        if (rcOrders.length > 0) {
            kpi.howMuchEmployeePaidAvg = kpi.howMuchEmployeePaidTotal / rcOrders.length;
        }

        return kpi;
    }





};


//#6A33CD
//L'article a été ajouté au panier.