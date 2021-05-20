const mongoose = require('mongoose');
const Store = require('../models/store')

module.exports = function monthly_sales() {

    function isLastDay(dt) {
        var test = new Date(dt.getTime()),
            month = test.getMonth();
    
        test.setDate(test.getDate() + 1);
        return test.getMonth() !== month;
    }

    function updateStoreSalesData(id, updateOps) {
        Store.update({_id: id}, {$set:  updateOps})
        .exec()
        .then(result => {
            console.log(result);
        })
        .catch(err => {
            console.log(err);
        });
    }

    function wait() {
        setTimeout(function() {
            const currentDate = new Date();

            Store.find().select('_id total_sales monthly_sales').exec()
            .then(docs => {
                const lastDayOfMonth = isLastDay(currentDate);
            
                if(lastDayOfMonth == true) {
                    for(const doc of docs) {
                        const month = currentDate.getMonth() + 1;
                        const year = currentDate.getFullYear();
                        var prevoiusMonthsSales = 0;
                        var previousMonthsRevenue = 0;
                        var sale = { };

                        for(const salesPerMonth of doc.monthly_sales) {
                            prevoiusMonthsSales += salesPerMonth.values().next().value;
                        }

                        for(const revenuePerMonth of doc.monthly_revenue) {
                            previousMonthsRevenue += revenuePerMonth.values().next().value;
                        }

                        sale[`${month}-${year}`] = doc.total_sales - prevoiusMonthsSales;
                        revenue[`${month}-${year}`] = doc.total_revenue - previousMonthsRevenue;

                        doc.monthly_sales.push(sale);
                        doc.monthly_revenue.push(revenue);
                        const updateOps = {
                            "monthly_sales": doc.monthly_sales,
                            "monthly_revenue": doc.monthly_revenue
                        };

                        updateStoreSalesData(doc._id, updateOps);
                    }
                    wait();
                } else {
                    wait();
                }
            })
            .catch(err => {
                console.log(err);
            });

        }, 86400000)
    }
    wait();

}