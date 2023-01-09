'use strict';
const { parseMultipartData, sanitizeEntity } = require('strapi-utils');
var add = require('date-fns/add')
var isToday = require('date-fns/isToday')
var format = require('date-fns/format')
var lastDayOfMonth = require('date-fns/lastDayOfMonth')
var isBefore = require('date-fns/isBefore')
var isAfter = require('date-fns/isAfter')
var parseISO = require('date-fns/parseISO')

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

module.exports = {
    // A funnction to get the top products for the mobile app 
    async getTopProducts(ctx) {
        // Declare an empty array that will hold the top products
        let myFinalProductList = []

        // Find all top products
        let topProductsList = await strapi.services.rctopproducts.find();

        // Loop through the top products list
        for (let i = 0; i < topProductsList.length; i++) {
            // Check if the current top product is within the valid date range
            let today = new Date()
            if (isAfter(today, topProductsList[i].from) && isBefore(today, topProductsList[i].to)) {
                // Find the product with the specified ID
                let oneProduct = await strapi.services.restauration.findOne({ id: topProductsList[i].sp });

                // Loop through the items of the product
                for (let j = 0; j < oneProduct.items.length; j++) {
                    // Check if the current item is the top product and if it is active
                    if (oneProduct.items[j].id == topProductsList[i].prouductId && oneProduct.items[j].status) {
                        // Loop through the locations where the item is shown
                        for (let k = 0; k < oneProduct.items[j].shownIn.length; k++) {
                            // Check if the item is shown in the "restauration-collectif" service
                            if (oneProduct.items[j].shownIn[k].serviceName == "restauration-collectif") {
                                // Create an object for the top product with relevant information
                                let myProduct = {
                                    id: oneProduct.items[j].id,
                                    image: oneProduct.items[j].firstImage.url,
                                    category: oneProduct.items[j].categories[0].name,
                                    name: oneProduct.items[j].name,
                                    waiting: "~30 min",
                                    rank: topProductsList[i].rank,
                                    sp: topProductsList[i].sp,
                                    spName: oneProduct.knownName
                                }
                                // Add the top product to the final product list
                                myFinalProductList.push(myProduct)
                            }
                        }
                    }
                }
            }
        }
        // Sort the final product list by rank
        myFinalProductList.sort((a, b) => a.rank - b.rank);
        // Return the final product list
        return myFinalProductList
    },

    async isThereAnyTopProduct(ctx) {
        let topProductsList = await strapi.services.rctopproducts.find();
        for (let i = 0; i < topProductsList.length; i++) {
            let today = new Date()
            if (isAfter(today, topProductsList[i].from) && isBefore(today, topProductsList[i].to)) {
                let oneProduct = await strapi.services.restauration.findOne({ id: topProductsList[i].sp });
                for (let j = 0; j < oneProduct.items.length; j++) {
                    if (oneProduct.items[j].id == topProductsList[i].prouductId && oneProduct.items[j].status) {
                        for (let k = 0; k < oneProduct.items[j].shownIn.length; k++) {
                            if (oneProduct.items[j].shownIn[k].serviceName == "restauration-collectif") {
                                return true

                            }
                        }
                    }
                }
            }
        }
        return false
    },
    async getProductsByCategories(ctx) {
        let myFinalProductByCategories = []
        let rcCategories = await strapi.services.rccategories.find();
        let restauration = await strapi.services.restauration.find()
        for (let i = 0; i < rcCategories.length; i++) {
            if (rcCategories[i].status) {
                let oneCategory = {
                    name: rcCategories[i].name,
                    id: rcCategories[i].id,
                    rank: rcCategories[i].rank,
                    items: []
                }
                for (let j = 0; j < restauration.length; j++) {
                    if (restauration[j].status) {
                        for (let k = 0; k < restauration[j].items.length; k++) {
                            if (restauration[j].items[k].status) {
                                for (let m = 0; m < restauration[j].items[k].shownIn.length; m++) {
                                    if (restauration[j].items[k].shownIn[m].serviceName == "restauration-collectif") {
                                        for (let p = 0; p < restauration[j].items[k].categories.length; p++) {
                                            if (restauration[j].items[k].categories[p].name == oneCategory.name) {
                                                console.log("8");
                                                let oneItem = {
                                                    id: restauration[j].items[k].id,
                                                    sp: restauration[j].id,
                                                    name: restauration[j].items[k].name,
                                                    image: restauration[j].items[k].firstImage.url,
                                                    discount: restauration[j].items[k].disocunt ? restauration[j].items[k].disocunt.percentage : null,
                                                    ratingTotal: restauration[j].ratingTotal,
                                                    ratingQuantity: restauration[j].rating.length > 0 ? restauration[j].rating.length : 1,
                                                    waiting: "~30 min",
                                                    restoName: restauration[j].knownName
                                                }
                                                oneCategory.items.push(oneItem)
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                myFinalProductByCategories.push(oneCategory)
            }
        }
        myFinalProductByCategories.sort((a, b) => a.rank - b.rank);
        return myFinalProductByCategories
    },


    async getProductsByOneCategories(ctx) {
        const { id } = ctx.params;
        let myFinalProductByCategories = []
        let rcCategories = await strapi.services.rccategories.findOne({
            id: id
        });
        let restauration = await strapi.services.restauration.find()

        if (rcCategories.status) {
            let oneCategory = {
                name: rcCategories.name,
                id: rcCategories.id,
                rank: rcCategories.rank,
                items: []
            }
            for (let j = 0; j < restauration.length; j++) {
                console.log("1");
                if (restauration[j].status) {
                    console.log("2");
                    for (let k = 0; k < restauration[j].items.length; k++) {
                        console.log("3");
                        if (restauration[j].items[k].status) {
                            console.log("4");
                            for (let m = 0; m < restauration[j].items[k].shownIn.length; m++) {
                                console.log("5");
                                if (restauration[j].items[k].shownIn[m].serviceName == "restauration-collectif") {
                                    console.log("6");
                                    for (let p = 0; p < restauration[j].items[k].categories.length; p++) {
                                        console.log("7");
                                        console.log(oneCategory.name);
                                        console.log(restauration[j].items[k].categories[p].name);
                                        console.log(restauration[j].items[k].categories[p].name == oneCategory.name);
                                        if (restauration[j].items[k].categories[p].name == oneCategory.name) {
                                            console.log("8");
                                            let oneItem = {
                                                id: restauration[j].items[k].id,
                                                sp: restauration[j].id,
                                                name: restauration[j].items[k].name,
                                                image: restauration[j].items[k].firstImage.url,
                                                discount: restauration[j].items[k].disocunt ? restauration[j].items[k].disocunt.percentage : null,
                                                ratingTotal: restauration[j].ratingTotal,
                                                ratingQuantity: restauration[j].rating.length > 0 ? restauration[j].rating.length : 1,
                                                waiting: "~30 min",
                                                restoName: restauration[j].knownName
                                            }
                                            oneCategory.items.push(oneItem)

                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
            myFinalProductByCategories.push(oneCategory)
        }

        myFinalProductByCategories.sort((a, b) => a.rank - b.rank);
        return myFinalProductByCategories[0]
    },

    async getCategories(ctx) {
        let finalListOfCategories = []
        let rcCategories = await strapi.services.rccategories.find();
        for (let i = 0; i < rcCategories.length; i++) {
            if (rcCategories[i].status) {
                let oneCategory = {
                    name: rcCategories[i].name,
                    image: rcCategories[i].image.url,
                    id: rcCategories[i].id,
                    rank: rcCategories[i].rank,
                    nbOfRestaurants: 0
                }
                finalListOfCategories.push(oneCategory)
            }
        }
        let restauration = await strapi.services.restauration.find()
        for (let j = 0; j < finalListOfCategories.length; j++) {
            for (let i = 0; i < restauration.length; i++) {
                let restaurantFound = false
                if (restauration[i].status) {
                    for (let p = 0; p < restauration[i].items.length; p++) {
                        if (restauration[i].items[p].status) {
                            for (let m = 0; m < restauration[i].items[p].shownIn.length; m++) {
                                if (restauration[i].items[p].shownIn[m].serviceName == "restauration-collectif") {
                                    for (let s = 0; s < restauration[i].items[p].categories.length; s++) {
                                        if (restauration[i].items[p].categories[s].name == finalListOfCategories[j].name) {
                                            restaurantFound = true

                                        }
                                    }
                                }
                            }
                        }
                    }
                    if (restaurantFound) {
                        finalListOfCategories[j].nbOfRestaurants = finalListOfCategories[j].nbOfRestaurants + 1
                    }
                }
            }
        }
        finalListOfCategories.sort((a, b) => a.rank - b.rank);
        return finalListOfCategories
    }

};
