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
    async getOneRcProduct(ctx) {
        const { productId, spId, rcEmployee } = ctx.params;
        let sp = await strapi.services.restauration.findOne({
            id: spId
        });
        let tax = await strapi.services.generalsettingsdefaults.find();
        console.log(tax.tvaRestaurationRc);
        // let profile = await strapi.services.rcemployees.findOne({ id: rcEmployee });
        // let profileOrders = await strapi.services.rcorders.find({ rcemployee: rcEmployee });
        // let employeeTotalToPay = 0
        // let employeeTotalOrders = 0
        // let employeeTotalToPayMonth = 0
        // let employeeTotalOrdersMonth = 0
        // for (let k = 0; k < profileOrders.length; k++) {
        //     if (isToday(profileOrders[k].scheduledDate)) {
        //         employeeTotalToPay = employeeTotalToPay + profileOrders[k].employeeToPay
        //         employeeTotalOrders = employeeTotalOrders + profileOrders[k].total
        //     }
        //     if(isThisMonth(profileOrders[k].scheduledDate)){
        //         employeeTotalToPayMonth = employeeTotalToPayMonth + profileOrders[k].employeeToPay
        //         employeeTotalOrdersMonth = employeeTotalOrdersMonth + profileOrders[k].total
        //     }
        // }
        
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
};
//63a0a740573980082dc8653d
// 63a0a429573980082dc8651f
//63bad8d44c920f7e8f5bd6b2

