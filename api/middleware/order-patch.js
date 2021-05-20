const Product = require('../models/product');
const Store = require('../models/store');
const Order = require('../models/order');
const fetch = require('node-fetch');
const getCurrentDate = require('../middleware/get-current-date');
const notificationSender = require('../middleware/notification-sender');

module.exports = async (req, res, next) => {
    
    const orderStatus = req.query.status;
    const orderId = req.params.orderId;
    var order = await Order.findById(orderId);
    const auth = "Basic " + new Buffer(process.env.RAZORPAY_API_KEY + ":" + process.env.RAZORPAY_KEY_SECRET).toString("base64");

    if(orderStatus === "Cancelled") {

        for(const store of order.store) {
            var storeId = store.id;
            await Order.update(
                {"_id": orderId, "store.id": storeId},
                {"$set": {"store.$.payout": "Order Cancelled"}});

            for(const item of store.ordered_products) {
                await Product.findOneAndUpdate({_id: item.id}, {$inc : {"total_sold": -(item.qty)}});
            }
            await Store.findOneAndUpdate({_id: storeId}, {$inc : {"total_sales": -(store.qty), "total_revenue": -(store.billing_amount * process.env.GETTO_SERVICE_CHARGE_CALC)}});
        }
        next();

    } else if(orderStatus === "Accepted") {

        notificationSender(order.customer, "OrderAccepted");
        next();

    } else if (orderStatus === "Delivered") {
        let url = `https://api.razorpay.com/v1/payouts`;

        for(const store of order.store) {
            var storeId = store.id;
            var storeData = await Store.findById(store.id);
            var payoutAmount = store.billing_amount * process.env.GETTO_SERVICE_CHARGE_CALC * 100;
            var referenceId = storeData.bank_details.account_holder_contact.toString();
            var currentDate = new Date().toISOString().slice(0, 10);
            var dailyRSLength = storeData.daily_rs_data.length - 1;

            if(storeData.daily_rs_data.length != 0 && storeData.daily_rs_data[dailyRSLength].date == currentDate) {
                var newSalesValue = storeData.daily_rs_data[dailyRSLength].sales + store.qty;
                var newRevenueValue = storeData.daily_rs_data[dailyRSLength].revenue + (store.billing_amount * process.env.GETTO_SERVICE_CHARGE_CALC);
                await Store.update({'daily_rs_data._id': storeData.daily_rs_data[dailyRSLength]._id}, {'$set': {"daily_rs_data.$.sales": newSalesValue, "daily_rs_data.$.revenue": newRevenueValue}});
            } else {
                var rsObject = {
                    date: currentDate,
                    sales: store.qty,
                    revenue: (store.billing_amount * process.env.GETTO_SERVICE_CHARGE_CALC)
                };

                await Store.update({"_id": storeId}, {"$push": {"daily_rs_data": rsObject}});
            }
            

            var payout = JSON.stringify({
                "account_number": "2323230060411191",
                "fund_account_id": storeData.razorpay_fund_id,
                "amount": payoutAmount,
                "currency": "INR",
                "mode": storeData.payout_method,
                "purpose": "vendor bill",
                "queue_if_low_balance": true,
                "reference_id": referenceId,
                "narration": "Vendor Fund Transfer"
            });


            const payoutOptions = {
                body: payout,
                method: 'POST', 
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': payout.length,
                    'Authorization': auth
                }
            };

            fetch(url, payoutOptions)
            .then(res => res.json())
            .then(async result => {
                console.log(result);
                await Order.update(
                    {"_id": orderId, "store.id": storeId},
                    {"$set": {"store.$.payout": "Completed"}});
            })
            .catch(err => {
                console.log(err);
                next();
            });
            var currentDateTime = getCurrentDate();
            await Order.update(
                    {"_id": orderId, "store.id": storeId},
                    {"$set": {"delivery_date": currentDateTime}});
        }
        next();
    } else {
        next();
    }
}