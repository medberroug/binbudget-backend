'use strict';
const { parseMultipartData, sanitizeEntity } = require('strapi-utils');
var add = require('date-fns/add')
var isToday = require('date-fns/isToday')
var format = require('date-fns/format')
/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

module.exports = {

    async cancelMyOrder(ctx) {
        const { id } = ctx.params;

        let entity;
        let myData;
        if (ctx.is('multipart')) {
            const { data, files } = parseMultipartData(ctx);
            myData = data
        } else {
            myData = ctx.request.body
        }
  
        if (myData.status[myData.status.length - 1].name == "validated") {
            console.log('IEYYYYYYYYYYE');
            let myOrder = await strapi.services.order.findOne({ id: id });
            let myClient = await strapi.services.client.findOne({ id: myOrder.byClient });
            let myInvoices = await strapi.services.invoice.find({ client: myClient.id });
        
            let myItemsForInvoice = []
            for (let i = 0; i < myOrder.items.length; i++) {
                myItemsForInvoice.push({
                    name: myOrder.items[i].name,
                    price: myOrder.items[i].price,
                    quantity: myOrder.items[i].quantity,
                    total: myOrder.items[i].quantity * myOrder.items[i].price,
                })
            }
            if (myOrder.withDelivery) {
                myItemsForInvoice.push({
                    name: "Frais de livraison",
                    price: myOrder.deliveryPrice,
                    quantity: 1,
                    total: myOrder.deliveryPrice,
                })
            }
            let myInvoiceVente = {
                type: "Vente",
                withType: myOrder.type,
                withTypeId: myOrder.linkedToSPItem.spID,
                client: myClient.id,
                fromAddress: {
                    street: "BBADDRESS",
                    city: "BBADDRESS",
                    country: "BBADDRESS",
                    legalName: "Business repas s.a.r.l.",
                },
                toAddress: {
                    street: myClient.companyDetails.address[0].street,
                    city: myClient.companyDetails.address[0].city,
                    country: myClient.companyDetails.address[0].country,
                    legalName: myClient.companyDetails.legalName,
                    ICE: myClient.companyDetails.ICE,
                },
                invoiceNumber: null,
                status: [{
                    name: "created",
                    comment: "la facture a été créée",
                    date: new Date(),
                }],
                DueDate: add(new Date(), {
                    days: myClient.invoicingLimits.dueDatesAfter,
                }),
                ref: "Commande N°" + myOrder.id + " (" + myOrder.type + ")",
                refType: myOrder.type,
                items: myItemsForInvoice,
                payments: [],
                subTotal: myOrder.subTotal,
                tax: myOrder.tax,
                total: myOrder.total,
                comment: null,
                stampedVersionPath: null,
            }

            // let myInvoiceAchat = {
            //     type: "Achat",
            //     withType: myOrder.type,
            //     withTypeId: myOrder.linkedToSPItem.spID,
            //     client: myClient.id,
            //     fromAddress: {
            //         street: "BBADDRESS",
            //         city: "BBADDRESS",
            //         country: "BBADDRESS",
            //         legalName: "Business repas s.a.r.l.",
            //     },
            //     toAddress: {
            //         street: myClient.companyDetails.address[0].street,
            //         city: myClient.companyDetails.address[0].city,
            //         country: myClient.companyDetails.address[0].country,
            //         legalName: myClient.companyDetails.legalName,
            //         ICE: myClient.companyDetails.ICE,
            //     },
            //     invoiceNumber: null,
            //     status: [{
            //         name: "created",
            //         comment: "la facture a été créée",
            //         date: new Date(),
            //     }],
            //     DueDate: add(new Date(), {
            //         days: myClient.invoicingLimits.dueDatesAfter,
            //     }),
            //     ref: "Commande N°" + myOrder.id + " (" + myOrder.type + ")",
            //     refType: myOrder.type,
            //     items: myItemsForInvoice,
            //     payments: [],
            //     subTotal: myOrder.subTotal,
            //     tax: myOrder.tax,
            //     total: myOrder.total,
            //     comment: null,
            //     stampedVersionPath: null,
            // }

            let myClientCredits = 0
            for (let i = 0; i < myInvoices.length; i++) {
                if (myInvoices[i].type=="Vente" && myInvoices[i].status[myInvoices[i].status.length - 1].name != "closed" && myInvoices[i].status[myInvoices[i].status.length - 1].name != "cancelled" && myInvoices[i].status[myInvoices[i].status.length - 1].name != "payed") {
                    if (myInvoices[i].status[myInvoices[i].status.length - 1].name == "pseudoPaid") {
                        let howMuchPaid = 0
                        for (let j = 0; j < myInvoices[i].payments.length; j++) {
                            howMuchPaid = howMuchPaid + myInvoices[i].payments[j].amount
                        }
                        myClientCredits = myClientCredits + myInvoices[i].total - howMuchPaid
                    } else {
                        myClientCredits = myClientCredits + myInvoices[i].total
                    }
                }
            }
            if (myClient.invoicingLimits.creditLimit <= myClientCredits && myOrder.paimentMode.type!="cod") {
                myInvoiceVente.status.push({
                    name: "validated",
                    comment: "La facture est validée, un numéro de facture unique est attribué (la facture doit être payée avant la prestation du service car le client n'a plus de marge de crédit).",
                    date: new Date(),
                })
                myInvoiceVente.DueDate = new Date()
                let myInvoicesForNumber = await strapi.services.invoice.find();
                let theInvoiceDayNumber = 1
                let invoiceNumber = ""
             
                while (theInvoiceDayNumber-1<myInvoicesForNumber.length) {
                    if (isToday(myInvoicesForNumber[theInvoiceDayNumber-1].createdAt) && theInvoiceDayNumber<myInvoicesForNumber.length) {
                        theInvoiceDayNumber = theInvoiceDayNumber + 1

                    } 
                     if(theInvoiceDayNumber==myInvoicesForNumber.length){
                        theInvoiceDayNumber = theInvoiceDayNumber + 1
                        theInvoiceDayNumber = theInvoiceDayNumber + ""
                        invoiceNumber = "CL" + format(new Date(), 'yyMMdd')
                        if (theInvoiceDayNumber.length == 4) {
                            invoiceNumber = invoiceNumber + theInvoiceDayNumber
                        }
                        if (theInvoiceDayNumber.length == 3) {
                            invoiceNumber = invoiceNumber + "0" + theInvoiceDayNumber
                        }
                        if (theInvoiceDayNumber.length == 2) {
                            invoiceNumber = invoiceNumber + "00" + theInvoiceDayNumber
                        }
                        if (theInvoiceDayNumber.length == 1) {
                            invoiceNumber = invoiceNumber + "000" + theInvoiceDayNumber
                        }
                        break
                    }
                }
                myInvoiceVente.invoiceNumber = invoiceNumber
                myInvoiceVente.status.push({
                    name: "forcePaiment",
                    comment: "la facture doit être payée avant la prestation du service car le client n'a plus de marge de crédit",
                    date: new Date(),
                })
            } else {
                myData.status.push({
                    name: "pending",
                    comment: "La commande est en cours ",
                    date: new Date(),
                })
                if(myOrder.paimentMode.type=="cod"){

                }
            }
            entity = await strapi.services.invoice.create(myInvoiceVente)
        }
        entity = await strapi.services.order.update({ id }, myData)
        return sanitizeEntity(entity, { model: strapi.models.order });
    },
};
