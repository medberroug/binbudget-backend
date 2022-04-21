'use strict';
const { parseMultipartData, sanitizeEntity } = require('strapi-utils');
var add = require('date-fns/add')
var isToday = require('date-fns/isToday')
var format = require('date-fns/format')
const nodemailer = require('nodemailer');
const userEmail = process.env.MYEMAIL
const userPass = process.env.MYPASS
const { emailTemplateQuoteSent } = require("../../../config/functions/emailTemplates/invoicing")
// Create reusable transporter object using SMTP transport.

async function sendemail(from, to, subject, html) {
    console.log('Email started');
    const transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
            user: 'contact@binbudget.com',
            pass: "Pixlabe2021",
        },
    });

    // Setup e-m  ail data.
    const options = {
        from,
        to,
        subject,
        html,
    };
    // Return a promise of the function that sends the email.
    let result = await transporter.sendMail(options);
    return result

}


/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

module.exports = {
    async update(ctx) {
        const { id } = ctx.params;

        let entity;
        if (ctx.is('multipart')) {
            const { data, files } = parseMultipartData(ctx);
            entity = await strapi.services.events.update({ id }, data, {
                files,
            });
            console.log('KHADMAAT IF');
        } else {
            console.log('KHADMAAT ELSE');
            console.log(ctx.request.body);
            entity = await strapi.services.events.update({ id }, ctx.request.body);
        }

        return sanitizeEntity(entity, { model: strapi.models.events });
    },
    async editStatus(ctx) {
        const { id } = ctx.params;
        let entity;
        if (ctx.is('multipart')) {
            const { data, files } = parseMultipartData(ctx);
            entity = await strapi.services.events.update({ id }, data, {
                files,
            });
        } else {

            entity = await strapi.services.events.update({ id }, ctx.request.body);
        }

        return sanitizeEntity(entity, { model: strapi.models.events });
    },
    async getEventOrder(ctx) {
        const { id } = ctx.params;
        let entity;
        if (ctx.is('multipart')) {
            const { data, files } = parseMultipartData(ctx);
            entity = await strapi.services.events.find();
        } else {

            entity = await strapi.services.events.find();
        }

        let tva = await strapi.services.generalsettingsdefaults.find();
        tva = tva.tva
        let myEventOrders = []
        for (let i = 0; i < entity.length; i++) {
            for (let j = 0; j < entity[i].eventOrderDetails.length; j++) {
                if (entity[i].eventOrderDetails[j].eventServiceProvider == id) {

                    let myItems = []
                    for (let k = 0; k < entity[i].eventOrderDetails[j].articles.length; k++) {
                        myItems.push({
                            comment: entity[i].eventOrderDetails[j].articles[k].comment,
                            discount: entity[i].eventOrderDetails[j].articles[k].discount,
                            firstImage: entity[i].eventOrderDetails[j].articles[k].firstImage,
                            itemID: entity[i].eventOrderDetails[j].articles[k].itemId,
                            name: entity[i].eventOrderDetails[j].articles[k].name,
                            price: entity[i].eventOrderDetails[j].articles[k].price * (1 - entity[i].eventOrderDetails[j].articles[k].discount / 100),
                            quantity: entity[i].eventOrderDetails[j].articles[k].quantity,
                        })
                    }
                    let myOrder = {
                        type: "event",
                        subType: entity[i].eventOrderDetails[j].type,
                        items: myItems,
                        subTotal: entity[i].eventOrderDetails[j].subTotal,
                        tax: entity[i].eventOrderDetails[j].subTotal * (tva / 100),
                        total: entity[i].eventOrderDetails[j].subTotal * (1 + tva / 100),
                        withDelivery: null,
                        linkedToSPItem: {
                            type: entity[i].eventOrderDetails[j].type,
                            spID: entity[i].eventOrderDetails[j].eventServiceProvider,
                        },
                        status: entity[i].eventOrderDetails[j].status,
                        deliveryPrice: null,
                        paimentMode: {
                            type: "invoice"
                        },
                        byClient: entity[i].byClient,
                        createdAt: entity[i].createdAt,
                        startDate: entity[i].startDate,
                        endDate: entity[i].endDate,
                        description: entity[i].description,
                        name: entity[i].name,
                        numberOfAttendees: entity[i].numberOfAttendees,
                        city: entity[i].city,
                        eventOrderDetailsId: entity[i].eventOrderDetails[j].id,
                        eventId: entity[i].id,

                    }
                    myEventOrders.push(myOrder)
                }

            }

        }


        return myEventOrders;
    },
    async getEventOrderOne(ctx) {
        const { id, event, order } = ctx.params;
        let entity;
        if (ctx.is('multipart')) {
            const { data, files } = parseMultipartData(ctx);
            entity = await strapi.services.events.find();
        } else {

            entity = await strapi.services.events.find();
        }

        let tva = await strapi.services.generalsettingsdefaults.find();
        tva = tva.tva
        let myEventOrders = []
        for (let i = 0; i < entity.length; i++) {
            for (let j = 0; j < entity[i].eventOrderDetails.length; j++) {
                if (entity[i].eventOrderDetails[j].eventServiceProvider == id) {

                    let myItems = []
                    for (let k = 0; k < entity[i].eventOrderDetails[j].articles.length; k++) {
                        myItems.push({
                            comment: entity[i].eventOrderDetails[j].articles[k].comment,
                            discount: entity[i].eventOrderDetails[j].articles[k].discount,
                            firstImage: entity[i].eventOrderDetails[j].articles[k].firstImage,
                            itemID: entity[i].eventOrderDetails[j].articles[k].itemId,
                            name: entity[i].eventOrderDetails[j].articles[k].name,
                            price: entity[i].eventOrderDetails[j].articles[k].price * (1 - entity[i].eventOrderDetails[j].articles[k].discount / 100),
                            quantity: entity[i].eventOrderDetails[j].articles[k].quantity,
                        })
                    }
                    let myOrder = {
                        type: "event",
                        subType: entity[i].eventOrderDetails[j].type,
                        items: myItems,
                        subTotal: entity[i].eventOrderDetails[j].subTotal,
                        tax: entity[i].eventOrderDetails[j].subTotal * (tva / 100),
                        total: entity[i].eventOrderDetails[j].subTotal * (1 + tva / 100),
                        withDelivery: null,
                        linkedToSPItem: {
                            type: entity[i].eventOrderDetails[j].type,
                            spID: entity[i].eventOrderDetails[j].eventServiceProvider,
                        },
                        status: entity[i].eventOrderDetails[j].status,
                        deliveryPrice: null,
                        paimentMode: {
                            type: "invoice"
                        },
                        byClient: entity[i].byClient,
                        createdAt: entity[i].createdAt,
                        startDate: entity[i].startDate,
                        endDate: entity[i].endDate,
                        description: entity[i].description,
                        name: entity[i].name,
                        numberOfAttendees: entity[i].numberOfAttendees,
                        city: entity[i].city,
                        eventOrderDetailsId: entity[i].eventOrderDetails[j].id,
                        eventId: entity[i].id,

                    }
                    if (myOrder.eventId == event && myOrder.eventOrderDetailsId == order) {
                        return myOrder
                    }
                    myEventOrders.push(myOrder)
                }

            }

        }

        return false;
    },
    async updateEventOrderDetail(ctx) {
        try {

            const { id, event, order } = ctx.params;
            let entity;

            if (ctx.is('multipart')) {
                const { data, files } = parseMultipartData(ctx);
                entity = await strapi.services.events.findOne({ id: event });
            } else {

                entity = await strapi.services.events.findOne({ id: event });
            }

            entity = sanitizeEntity(entity, { model: strapi.models.events })
            let tva = await strapi.services.generalsettingsdefaults.find();
            tva = tva.tva


            for (let i = 0; i < entity.eventOrderDetails.length; i++) {
                if (entity.eventOrderDetails[i].id == order) {
                    if (ctx.request.body.action == "validate") {

                        if (ctx.request.body.who) {
                            entity.eventOrderDetails[i].status.push({
                                name: "validated",
                                comment: "Commande validée par le client. ",
                                date: new Date().toISOString(),
                            })
                        } else {
                            entity.eventOrderDetails[i].status.push({
                                name: "validated",
                                comment: "Commande validée par le fournisseur. ",
                                date: new Date().toISOString(),
                            })
                        }

                        let allOrdersValidated = true
                        for (let k = 0; k < entity.eventOrderDetails.length; k++) {
                            if (entity.eventOrderDetails[k].status[entity.eventOrderDetails[k].status.length - 1].name != "validated") {
                                allOrdersValidated = false
                            }
                        }
                        if (allOrdersValidated) {
                            entity.status.push({
                                name: "validated",
                                comment: "l'évènement est validée. ",
                                date: new Date().toISOString(),
                            })

                            let myItemsForInvoice = []
                            let myInvoiceVentesubTotal = 0

                            for (let k = 0; k < entity.eventOrderDetails.length; k++) {
                                let myItemsForInvoiceAchat = []
                                let eventServiceProvider = await strapi.services.eventserviceprovider.findOne({ id: entity.eventOrderDetails[k].eventServiceProvider })
                                for (let m = 0; m < entity.eventOrderDetails[k].articles.length; m++) {
                                    myItemsForInvoice.push({
                                        name: entity.eventOrderDetails[k].articles[m].name,
                                        price: entity.eventOrderDetails[k].articles[m].price * (1 - entity.eventOrderDetails[k].articles[m].discount / 100),
                                        quantity: entity.eventOrderDetails[k].articles[m].quantity,
                                        total: entity.eventOrderDetails[k].articles[m].subTotal,
                                    })
                                    myItemsForInvoiceAchat.push({
                                        name: entity.eventOrderDetails[k].articles[m].name,
                                        price: entity.eventOrderDetails[k].articles[m].price * (1 - eventServiceProvider.percentageTaking / 100),
                                        quantity: entity.eventOrderDetails[k].articles[m].quantity,
                                        total: entity.eventOrderDetails[k].articles[m].quantity * entity.eventOrderDetails[k].articles[m].price * (1 - eventServiceProvider.percentageTaking / 100),
                                    })
                                }

                                let myInvoiceAchat = {
                                    type: "Achat",
                                    withType: "event",
                                    withTypeId: eventServiceProvider.id,
                                    client: null,
                                    toAddress: {
                                        street: "297 Hay Riad",
                                        city: "Rabat",
                                        country: "Maroc",
                                        legalName: "Business repas s.a.r.l.",
                                        ICE: "ICE BB"
                                    },
                                    fromAddress: {
                                        street: eventServiceProvider.address.street,
                                        city: eventServiceProvider.address.city,
                                        country: eventServiceProvider.address.country,
                                        legalName: eventServiceProvider.legalName,
                                    },
                                    invoiceNumber: null,
                                    status: [{
                                        name: "created",
                                        comment: "la facture a été créée",
                                        date: new Date().toISOString(),
                                    }],
                                    DueDate: add(new Date(), {
                                        days: eventServiceProvider.dueDatesAfter,
                                    }),
                                    ref: "Evènement N°" + entity.id + " (Evénements)",
                                    refType: "event",
                                    items: myItemsForInvoiceAchat,
                                    payments: [],
                                    subTotal: entity.eventOrderDetails[k].subTotal * (1 - eventServiceProvider.percentageTaking / 100),
                                    tax: entity.eventOrderDetails[k].subTotal * (tva / 100) * (1 - eventServiceProvider.percentageTaking / 100),
                                    total: entity.eventOrderDetails[k].subTotal * (1 - eventServiceProvider.percentageTaking / 100) + entity.eventOrderDetails[k].subTotal * (tva / 100) * (1 - eventServiceProvider.percentageTaking / 100),
                                    comment: null,
                                    stampedVersionPath: null,
                                }
                                myInvoiceVentesubTotal = myInvoiceVentesubTotal + entity.eventOrderDetails[k].subTotal
                                entity.eventOrderDetails[k].status.push(
                                    {
                                        name: "pending",
                                        comment: "la commande est en cours. ",
                                        date: new Date().toISOString(),
                                    }
                                )

                                let newInvoiceAchat = await strapi.services.invoice.create(myInvoiceAchat)

                            }
                            // Create Invoice Vente
                            let myClient = await strapi.services.client.findOne({ id: entity.byClient })
                            let anAwaitedInvoiceNumber = await assignNumber()
                            let myInvoiceVente = {
                                type: "Vente",
                                withType: "event",
                                withTypeId: entity.id,
                                client: myClient.id,
                                fromAddress: {
                                    street: "297 Hay Riad",
                                    city: "Rabat",
                                    country: "Maroc",
                                    legalName: "Business repas s.a.r.l.",
                                },
                                toAddress: {
                                    street: myClient.companyDetails.address[0].street,
                                    city: myClient.companyDetails.address[0].city,
                                    country: myClient.companyDetails.address[0].country,
                                    legalName: myClient.companyDetails.legalName,
                                    ICE: myClient.companyDetails.ICE,
                                },
                                invoiceNumber: anAwaitedInvoiceNumber,
                                status: [{
                                    name: "created",
                                    comment: "la facture a été créée",
                                    date: new Date().toISOString(),
                                }],
                                DueDate: add(new Date(), {
                                    days: myClient.invoicingLimits.dueDatesAfter,
                                }),
                                ref: "Evènement N°" + entity.id + " (Evénements)",
                                refType: "event",
                                items: myItemsForInvoice,
                                payments: [],
                                subTotal: myInvoiceVentesubTotal,
                                tax: myInvoiceVentesubTotal * (tva / 100),
                                total: myInvoiceVentesubTotal * (1 + tva / 100),
                                comment: null,
                                stampedVersionPath: null,
                            }
                            entity.status.push({
                                name: "pending",
                                comment: "l'évènement est en cours. ",
                                date: new Date().toISOString(),
                            })
                            let newInvoiceVente = await strapi.services.invoice.create(myInvoiceVente)

                        }
                    } else if (ctx.request.body.action == "close") {
                        entity.eventOrderDetails[i].status.push({
                            name: "closed",
                            comment: "La commande a été fermée et archivée par le fournisseur. ",
                            date: new Date().toISOString(),
                        })

                        let allOrdersClosed = true
                        for (let k = 0; k < entity.eventOrderDetails.length; k++) {
                            if (entity.eventOrderDetails[k].status[entity.eventOrderDetails[k].status.length - 1].name != "closed") {
                                allOrdersClosed = false
                            }
                        }
                        if (allOrdersClosed) {
                            entity.status.push({
                                name: "closed",
                                comment: "L'événement est terminé et archivé. ",
                                date: new Date().toISOString(),
                            })





                        }
                    } else if (ctx.request.body.action == "cancel") {
                        entity.eventOrderDetails[i].status.push({
                            name: "cancelled",
                            comment: "La commande a été annulée par le client.",
                            date: new Date().toISOString(),
                        })

                        let allOrdersCancelled = true
                        for (let k = 0; k < entity.eventOrderDetails.length; k++) {
                            if (entity.eventOrderDetails[k].status[entity.eventOrderDetails[k].status.length - 1].name != "cancelled") {
                                allOrdersCancelled = false
                            }
                        }
                        if (allOrdersCancelled) {
                            entity.status.push({
                                name: "cancelled",
                                comment: "L'événement  a été annulée par le client. ",
                                date: new Date().toISOString(),
                            })





                        }
                    } else if (ctx.request.body.action == "quote") {
                        let userEmails = await strapi.services.client.findOne({ id: entity.byClient });
                        let toSendEmails = ""
                        for (let p = 0; p < userEmails.contactPerson.length; p++) {
                            if (userEmails.contactPerson[p].informMeOfInvoices) {
                                toSendEmails = toSendEmails + ', ' + userEmails.contactPerson[p].email
                            }
                            toSendEmails = toSendEmails + ', ' + userEmails.contactPerson[p].email
                        }


                        entity.eventOrderDetails[i].status.push({
                            name: "quoteSent",
                            comment: "Le fournisseur a transmis son devis, il attend la décision du client. ",
                            date: new Date().toISOString(),
                        })
                        for (let p = 0; p < entity.eventOrderDetails[i].articles.length; p++) {
                            entity.eventOrderDetails[i].articles[p].price = ctx.request.body.items[p].price
                            entity.eventOrderDetails[i].articles[p].subTotal = ctx.request.body.items[p].price * ctx.request.body.items[p].quantity
                            entity.eventOrderDetails[i].subTotal = entity.eventOrderDetails[i].subTotal + ctx.request.body.items[p].price * ctx.request.body.items[p].quantity
                        }


                        let stillPendingQuote = false
                        let message = emailTemplateQuoteSent(entity, entity.eventOrderDetails[i])
                            let resultEmail = await sendemail("contact@binbudget.com", toSendEmails, `Un fournisseur a transmis son devis pour l'événement  ${entity.name}`, message)
                            console.log(resultEmail);
                        for (let k = 0; k < entity.eventOrderDetails.length; k++) {
                            if (entity.eventOrderDetails[k].status[entity.eventOrderDetails[k].status.length - 1].name == "pendingQuote") {
                                stillPendingQuote = true
                            }
                        }
                        if (!stillPendingQuote) {
                            entity.status.push({
                                name: "quoteSent",
                                comment: "En attente des décisions du client sur les devis des fournisseurs. ",
                                date: new Date().toISOString(),
                            })





                        } else {
                            
                        }
                    }
                }

            }






            return entity;
        } catch (error) {
            console.log(error);
        }
    }
};





async function assignNumber() {
    let myInvoicesForNumber = await strapi.services.invoice.find();
    let theInvoiceDayNumber = 1
    let invoiceNumber = ""
    let isTodayInvoices = []


    myInvoicesForNumber = myInvoicesForNumber.reverse()
    for (let i = 0; i < myInvoicesForNumber.length; i++) {
        if (isToday(myInvoicesForNumber[i].createdAt)) {
            if (myInvoicesForNumber[i].type == "Vente") {
                isTodayInvoices.push(myInvoicesForNumber[i])

            }
        } else {
            break
        }
    }
    if (isTodayInvoices.length == 0) {
        invoiceNumber = "CL" + format(new Date(), 'yyMMdd') + "0001"
    } else {

        theInvoiceDayNumber = isTodayInvoices.length + 1
        theInvoiceDayNumber = theInvoiceDayNumber.toString()
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
    }



    return invoiceNumber
}