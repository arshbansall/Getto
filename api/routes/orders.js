//Directly sending payment to merchent/seller
const express = require('express');
const orderParsing = require('../middleware/order-parsing');
const router = express.Router();
const mongoose = require('mongoose');
const Order = require('../models/order');
const generatePayId = require('../middleware/generate-payId');
const orderPatch = require('../middleware/order-patch');
const getCurrentDate = require('../middleware/get-current-date');
const geocoding = require('../middleware/geocoding');
const sendNotification = require('../middleware/notification-sender');
const notificationSender = require('../middleware/notification-sender');

router.post('/', orderParsing, geocoding, async (req, res, next) => {
 
    const data = JSON.parse(req.body);
    var payID = '';
    var orderPlacementDate = getCurrentDate();

    if(data.payment.paymentID) {
        payID = data.payment.paymentID;
    } else {
        payID = await generatePayId(); 
    }
    
    const order = new Order({
        _id: new mongoose.Types.ObjectId,

        customer: req.customerId,
        getto_service_charge: process.env.GETTO_SERVICE_CHARGE,
        store: req.storeArray,

        order_date: new Date(orderPlacementDate),
        location: {
            address_line1 : data.location.address_line1,
            address_line2 : data.location.address_line2,
            city : data.location.city,
            pin_code: data.location.pin_code,
            address_coordinates: {
                type: data.location.type,
                coordinates: req.coordinates
            }
        },

        order_status: data.order_status,
        total_price: req.total_price,

        payment: {
            payment_method: data.payment.payment_method,
            paymentID: payID
        }
    });
    order
    .save()
    .then(result => {
        notificationSender(order, 'NotifyOrder');
        console.log(result);
        res.status(201).json({
            message: "Order Posted Sucessfully"
        });
    })
    .catch(err => {
        console.log(err);
        res.status(500).json({
            error: err
        });
    });
});

router.get('/', (req, res, next) => {
    Order
    .find()
    .populate('customer', 'name location.address_line1 location.address_line2 location.pin_code location.city phone_number')
    .exec()
    .then(docs => {
        const response = {
            count: docs.length,
            orders: docs
        };
        res.status(200).json(response);
    })
    .catch(err => {
        console.log(err);
        res.status(500).json({
            error: err
        });
    }); 
});

router.get('/user/:userId', (req, res, next) => {
    const userId = req.params.userId;

    Order
    .find({"customer": userId})
    .exec()
    .then(orders => {

        var ordersArray = [];

        for(const order of orders) {
            var productsOrdered = [];
            for(const store of order.store) {
                for(const product of store.ordered_products){
                    productsOrdered.push(product);
                }
            }
            var orderInfo = {
                _id: order._id,
                payment: order.payment,
                products: productsOrdered,
                total_price: order.total_price,
                order_status: order.order_status,
                delivery_date: order.delivery_date,
                order_date: order.order_date
            }
            ordersArray.push(orderInfo);
        }

        const response = {
            count: orders.length,
            orders: ordersArray
        };
        res.status(200).json(response);
    })
    .catch(err => {
        console.log(err);
        res.status(500).json({
            error: err
        });
    }); 
});

router.get('/store/:storeId', (req, res, next) => {
    const storeId = req.params.storeId;
    const orderStatus = req.query.status;

    Order
    .find({'store.id': storeId, 'order_status': orderStatus})
    .exec()
    .then(orders => {

        var ordersArray = [];
        var payoutStatus;
        
        for(const order of orders) {
            var productsOrdered = [];
            var orderAmount = 0;
            for(const store of order.store) {
                if(store.id === storeId) {
                    payoutStatus = store.payout;
                    for(const product of store.ordered_products) {
                        orderAmount += (product.price * product.qty);
                        productsOrdered.push(product);
                    }
                    break;
                }
            }
            var orderInfo = {
                _id: order._id,
                ordered_products: productsOrdered,
                billing_amount: orderAmount,
                getto_service_charge: order.getto_service_charge,
                payment: order.payment,
                delivery_date: order.delivery_date,
                payout_status: payoutStatus,
                order_status: order.order_status, 
                order_date: order.order_date
            }
            ordersArray.push(orderInfo);
        }
        const response = {
            count: orders.length,
            orders: ordersArray
        };
        res.status(200).json(response);
    })
    .catch(err => {
        console.log(err);
        res.status(500).json({
            error: err
        });
    }); 
});

router.patch('/:orderId', orderPatch, (req, res, next) => {
    
    const status = req.query.status;
    const orderId = req.params.orderId;

    Order
    .findOneAndUpdate({_id: orderId}, {$set : {'order_status': status}})
    .exec()
    .then(result => {
        res.status(200).json(result)
    })
    .catch(err => {
        console.log(err);
        res.status(500).json({
            error: err
        });
    }); 
});

module.exports = router;