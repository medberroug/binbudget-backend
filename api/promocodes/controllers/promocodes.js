'use strict';
const { sanitizeEntity } = require('strapi-utils');
/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

module.exports = {
    async verifyPromoCode(ctx) {
        let entities;
        const { number, code, amount, invoice } = ctx.params;
        if (ctx.query._q) {
            entities = await strapi.services.promocodes.search(ctx.query);
        } else {
            entities = await strapi.services.promocodes.find(ctx.query);
        }
        let myPromoCodes = []
        if (entities) {
            myPromoCodes = entities.map(entity => sanitizeEntity(entity, { model: strapi.models.promocodes }));
        }

        for (let i = 0; i < myPromoCodes.length; i++) {
            if (myPromoCodes[i].number == number) {
                if (myPromoCodes[i].code == code) {
                    if (myPromoCodes[i].balance >= parseFloat(amount)) {
                        myPromoCodes[i].balance = myPromoCodes[i].balance - amount
                        await strapi.services.promocodes.update({ id: myPromoCodes[i].id }, myPromoCodes[i])
                        let myInvoice = await strapi.services.invoice.findOne({ id: invoice })
                        let tobePaid = 0
                        for (let j = 0; j < myInvoice.payments.length; j++) {
                            tobePaid = tobePaid + myInvoice.payment[j].amount
                        }
                        tobePaid = myInvoice.total - tobePaid
                        console.log(myInvoice.total);
                        console.log(amount);
                        if (myInvoice.total == amount) {
                           
                            myInvoice.status.push({
                                name: "paid",
                                comment: "La facture a été entièrement payée avec un Code promo",
                                date: new Date(),
                            })
                            console.log(myInvoice.status);
                            myInvoice.payments.push({
                                amount: amount,
                                date: new Date(),
                                method: "promoCode",
                            })
                        } else {
                            myInvoice.status.push({
                                name: "pseudoPaid",
                                comment: "La facture est partiellement payée",
                                date: new Date(),
                            })
                            console.log(myInvoice.status);
                            myInvoice.payments.push({
                                amount: amount,
                                date: new Date(),
                                method: "promoCode",
                            })
                        }
                        // console.log(myInvoice.status);
                        // await strapi.services.invoice.update({ id: invoice }, {
                        //     // payments: myInvoice.payments,
                        //     status: myInvoice.status
                        // })
                   

                        return [true, myInvoice]
                    } else {
                        return [false, "Le code ou le numéro ne sont pas corrects"]
                    }
                } else {
                    return [false, "Le code ou le numéro ne sont pas corrects"]
                }
            } else {
                return [false, "Le code ou le numéro ne sont pas corrects"]
            }
        }
        return [false, "Le code ou le numéro ne sont pas corrects"]
    }
};
