//Add monthly revenue
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose'); //Checking and testing Git part 2
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const geocoding = require('../middleware/geocoding');
const Store = require('../models/store');
const addStoreToRazorpay = require('../middleware/add-razorpaycontact');
const updateRazorpayContact = require('../middleware/update-razorpaycontact');
const otpFunctions = require('../middleware/twilio-verification');
const validatePhoneNumber = require('validate-phone-number-node-js');

router.post('/genOTP', (req, res, next) => {
    const phoneNumber = req.query.phonenumber;
    const result = validatePhoneNumber.validate(phoneNumber);
    
    if(result) {
        const data = otpFunctions.generateOTP(phoneNumber);
        res.status(200).json({data: data});
    } else {
        res.status(400).json({error: "Incorrect Phone Number"});
    }
});

router.post('/verifyOTP',otpFunctions.verifyOTP, (req, res, next) => {
    res.status(200).json({data: req.data});
});

router.get('/forgot', (req, res, next) => {
    let i;
    const data = req.query.forgotdata;
    const phone = Number.isNaN(parseInt(data, 10)) ? "123" : parseInt(data, 10);
    const query = { $or : [{email: data}, {"owner.contact_number": phone}]};

    Store.find(query)
    .exec()
    .then(store => {
        if(store.length < 1) {
            res.status(401).json({
                message: 'Store Does Not Exist!' 
            });
        } else {
            //const data = otpFunctions.generateOTP(store.owner.contact_number);
            res.status(200).json({
                otp_contact: store[0].owner.contact_number, 
                _id: store[0]._id
            });
        }
    })
});

router.post('/registerstore', otpFunctions.verifyOTP, geocoding, addStoreToRazorpay, (req, res, next) => {
    const data = JSON.parse(req.body);
    const query = { $or: [{email: data.email}, {"owner.contact_number": data.owner.contact_number}]}

    Store.find(query)
    .exec()
    .then(store => {
        if(store.length >= 1) {
            res.status(409).json({
                message: "Store Exists"
            });
        } else {
            bcrypt.hash(data.password, 10, (err, hash) => {
                if(err) {
                    return res.status(500).json({
                        error: err
                    });
                } else {
                    const store = new Store({
                        _id: new mongoose.Types.ObjectId(),
                        razorpay_id: req.result.contact_id,
                        razorpay_fund_id: req.result.id, 
                        device_token: data.device_token,
                        payout_method: data.payout_method,

                        name: data.name, 
                        email: data.email, 
                        password: hash, 

                        owner: {
                            name: data.owner.name,
                            contact_number: data.owner.contact_number,
                            email: data.owner.email
                        },

                        location: {
                            address_line1: data.location.address_line1,
                            address_line2: data.location.address_line2,

                            address_coordinates: {
                                type: data.location.type,
                                coordinates: req.coordinates
                            },
                            pin_code: data.location.pin_code,
                            city: data.location.city
                        },

                        bank_details: data.bank_details,

                        opening_time: data.opening_time,
                        closing_time: data.closing_time,
                        working_days: data.working_days,

                        store_contact_number: data.store_contact_number,
                        total_sales: data.total_sales,
                        total_revenue: data.total_revenue,
                        daily_rs_data: data.daily_rs_data,
                    });
                    store
                    .save()
                    .then(result => {
                        console.log(result);
                        res.status(201).json({
                            message: 'Store Registered'
                        });
                    })
                    .catch(err => {
                        console.log(err);
                        res.status(500).json({
                            error: err
                        });
                    }); 
                }
            })
        }
    })
}); 

router.post('/support', (req, res, next) => {
    var numbers = ['+91 83370 63223'];
    var emails = ['store.support@getto.com'];
    
    res.status(200).json({
        contact_number: numbers,
        email: emails
    });
});

router.patch('/:storeId', geocoding, updateRazorpayContact, (req, res, next) => { 
    const id = req.params.storeId;
    const updateOps = req.parsedUpdateData; //JSON.parse(req.body); 
    console.log(updateOps);

    if(req.coordinates != null) {
        updateOps['location']['address_coordinates'] = {"type": "Point", "coordinates": req.coordinates};
    }

    if(updateOps.password) {
        bcrypt.hash(updateOps.password, 10, (err, hash) => {
            updateOps.password = hash
            Store.update({_id: id}, { $set: updateOps })
            .exec()
            .then(result => {
                console.log(result);
                res.status(200).json(result);
            })
            .catch(err => {
                console.log(err);
                res.status(500).json({
                    error: err
                });
            });
        })
    } else {
        Store.update({_id: id}, { $set: updateOps })
        .exec()
        .then(result => {
            res.status(200).json(result);
        })
        .catch(err => {
            console.log(err);
            res.status(500).json({
                error: err
            });
        });
    }
});

router.post('/logintostore', (req, res, next) => {
    const data = JSON.parse(req.body); //add JSON.parse(req.body) when using app 
    console.log(data);
    Store.find({email: data.email})
    .exec()
    .then(store => {
       if(store.length < 1) {
           res.status(401).json({
              message: 'Auth failed' 
           });
       } 
       bcrypt.compare(data.password, store[0].password, (err, result) => {
          if(err) {
              res.status(401).json({
                  message: 'Auth Failed'
              });
          }
          if(result) {
              const token = jwt.sign({
                    store: {
                        email: store[0].email,
                        id: store[0]._id
                        },
                    },
                    process.env.JWT_KEY,
                    {    
                        expiresIn: "1h"
                    }
               );
                return res.status(200).json({
                    message: 'Auth successful',
                    _id: store[0]._id,
                    name: store[0].name,
                    email: store[0].email,
                    password: store[0].password,
                    bank_details: store[0].bank_details,
                    location: store[0].location,
                    payout_method: store[0].payout_method,
                    owner: store[0].owner,
                    working_days: store[0].working_days,
                    opening_time: store[0].opening_time,
                    closing_time: store[0].closing_time,
                    device_token: store[0].device_token,
                    store_contact_number: store[0].store_contact_number,
                    total_sales: store[0].total_sales,
                    daily_rs_data: store[0].daily_rs_data,
                    total_revenue: store[0].total_revenue,
                    token: token
                });
            }
            res.status(401).json({
                message: 'auth Failed'
            });
       });
    })
    .catch(err => {
        console.log(err);
        res.status(500).json({
            error: err
        });
    });
});

router.get('/:storeId', (req, res, next) => { 
    const ID = req.params.storeId;

    Store.findById(ID)
    .exec()
    .then(docs => {
      console.log(docs)
      res.status(200).json(docs);
    })
    .catch(err => {
      console.log(err);
      res.status(500).json({
          error: err
      });
    });
});


module.exports = router;
