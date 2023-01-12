'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

module.exports = {
    async extractKpiInvoices1() {
        const invoices = await strapi.query("invoices").find({ type: "Vente" });

        // calculate the average number of items in each invoice
        const avgNumItems = invoices.reduce((acc, cur) => acc + cur.items.length, 0) / invoices.length;

        // calculate the average total of each invoice
        const avgTotal = invoices.reduce((acc, cur) => acc + cur.total, 0) / invoices.length;

        // calculate the sum of all invoice totals
        const sumTotal = invoices.reduce((acc, cur) => acc + cur.total, 0);

        // calculate the total number of invoices
        const numInvoices = invoices.length;

        // create an array of json objects containing the client, total amount of invoices, number of invoices, and average amount of invoice amounts
        const clientData = invoices.reduce((acc, cur) => {
            const existingData = acc.find(data => data.client === cur.client);
            if (existingData) {
                existingData.numInvoices += 1;
                existingData.totalAmount += cur.total;
                existingData.avgAmount = existingData.totalAmount / existingData.numInvoices;
            } else {
                acc.push({ client: cur.client, numInvoices: 1, totalAmount: cur.total, avgAmount: cur.total });
            }
            return acc;
        }, []);

        return {
            avgNumItems,
            avgTotal,
            sumTotal,
            numInvoices,
            clientData
        };
    },
    async extractKpiInvoices2() {
        const invoices = await strapi.query("invoices").find({ type: "Vente" });

        // create a mapping of status -> total amount of invoices
        let statusSum = new Map();

        // create a mapping of status -> count of invoices
        let statusCount = new Map();

        // loop through each invoice
        for (let invoice of invoices) {
            let status = invoice.status.slice(-1)[0].status
            if (!statusSum.has(status)) {
                statusSum.set(status, 0);
            }
            if (!statusCount.has(status)) {
                statusCount.set(status, 0);
            }
            statusSum.set(status, statusSum.get(status) + invoice.total);
            statusCount.set(status, statusCount.get(status) + 1);
        }

        return {
            statusSum,
            statusCount
        };
    },


    async extractKpiInvoices3() {
        let kpis = {};
        const invoices = await strapi.query("invoices").find({ type: "Vente" });
        for (let invoice of invoices) {
            if (invoice.type === "Vente") {
                let statuses = invoice.status;
                let latestStatus = statuses[statuses.length - 1];
                let latestStatusDate = new Date(latestStatus.date);
                //Calculating how much time it takes an invoice to go from created to validated
                if (latestStatus.name === "validated") {
                    let createdStatus = statuses.find(status => status.name === "created");
                    if (createdStatus) {
                        let createdStatusDate = new Date(createdStatus.date);
                        let timeTaken = latestStatusDate - createdStatusDate;
                        if (!kpis.timeTakenFromCreatedToValidated) {
                            kpis.timeTakenFromCreatedToValidated = timeTaken;
                        } else {
                            kpis.timeTakenFromCreatedToValidated += timeTaken;
                        }
                    }
                }
                //Calculating how much time it takes an invoice to go from validated to paid
                if (latestStatus.name === "paid") {
                    let validatedStatus = statuses.find(status => status.name === "validated");
                    if (validatedStatus) {
                        let validatedStatusDate = new Date(validatedStatus.date);
                        let timeTaken = latestStatusDate - validatedStatusDate;
                        if (!kpis.timeTakenFromValidatedToPaid) {
                            kpis.timeTakenFromValidatedToPaid = timeTaken;
                        } else {
                            kpis.timeTakenFromValidatedToPaid += timeTaken;
                        }
                    }
                }
                //Calculating how much time it takes an invoice to go from validated to pseudoPaid
                if (latestStatus.name === "pseudoPaid") {
                    let validatedStatus = statuses.find(status => status.name === "validated");
                    if (validatedStatus) {
                        let validatedStatusDate = new Date(validatedStatus.date);
                        let timeTaken = latestStatusDate - validatedStatusDate;
                        if (!kpis.timeTakenFromValidatedToPseudoPaid) {
                            kpis.timeTakenFromValidatedToPseudoPaid = timeTaken;
                        } else {
                            kpis.timeTakenFromValidatedToPseudoPaid += timeTaken;
                        }
                    }
                }
            }
            //Calculating how much time it takes an invoice to go from validated to overDueDate
            // if (latestStatus.name === "overDueDate") {
            //   let validatedStatus = statuses.find(status => status.name === "validated");
            //   if (validatedStatus) {
            //     let validatedStatusDate = new Date(validatedStatus.date);
            //     let timeTaken = latestStatusDate - validatedStatusDate;
            //     if (!kpis.timeTakenFromValidatedToOverDueDate) {
            //       kpis.timeT
        }
    }


};
