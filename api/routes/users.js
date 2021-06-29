const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const otpFunctions = require('../middleware/twilio-verification');
const validatePhoneNumber = require('validate-phone-number-node-js');
const aboutUs = require('../constants/about-us.json');

const geocoding = require('../middleware/geocoding');

const User = require('../models/user');

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

router.post('/verifyOTP', otpFunctions.verifyOTP, (req, res, next) => {
    res.status(200).json({data: req.data});
});

router.get('/forgot', (req, res, next) => {
    const data = req.query.forgotdata;
    const phone = Number.isNaN(parseInt(data, 10)) ? "123" : parseInt(data, 10);
    const query = { $or : [{email: data}, {phone_number: phone}]};

    User.find(query)
    .exec()
    .then(user => {
        if(user.length < 1) {
            res.status(401).json({
                message: 'User Does Not Exist!' 
            });
        } else {
            res.status(200).json({
                otp_contact: user[0].phone_number, 
                _id: user[0]._id
            });
        }
    })
});

router.post('/signup', otpFunctions.verifyOTP, geocoding, (req, res, next) => {
    const data = JSON.parse(req.body);
    const query = { $or: [{email: data.email}, {phone_number: data.phone_number}]};
    
    User.find(query)
    .exec()
    .then(user => {
        if(user.length >= 1) {
            res.status(409).json({
                message: "User Exists"
            });
        } else {
            bcrypt.hash(data.password, 10, (err, hash) => {
                if(err) {
                    return res.status(500).json({
                        error: err
                    });
                } else {
                    const user = new User({
                        _id: new mongoose.Types.ObjectId(),
                        device_token: data.device_token,
                        name: data.name, 
                        email: data.email, 
                        password: hash, 
                        phone_number: data.phone_number,
                        location: {
                            address_line1: data.location.address_line1,
                            address_line2: data.location.address_line2,

                            address_coordinates: {
                                type: data.location.type,
                                coordinates: req.coordinates
                            },
                            pin_code: data.location.pin_code,
                            city: data.location.city
                        }
                    });
                    user
                    .save()
                    .then(result => {
                        //console.log(result);
                        res.status(201).json({
                            message: 'User Created'
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

router.post('/login', (req, res, next) => {
    const data = JSON.parse(req.body); //add JSON.parse(req.body) when using app 
    
    User.find({email: data.email})
    .exec()
    .then(user => {
       if(user.length < 1) {
           res.status(401).json({
              message: 'Auth failed' 
           });
       } 
       bcrypt.compare(data.password, user[0].password, (err, result) => {
          if(err) {
              res.status(401).json({
                  message: 'Auth Failed'
              });
          }
          if(result) {
              const token = jwt.sign({
                    user : {
                        _id: user[0]._id,
                        name: user[0].name,
                        email: user[0].email,
                        password: user[0].password,
                        location: {
                            address_line1: user[0].location.address_line1, 
                            address_line2: user[0].location.address_line2,
                            pin_code: user[0].location.pin_code,
                            city: user[0].location.city
                        },
                        phone_number: user[0].phone_number,
                        device_token: user[0].device_token
                    },
                    items : "items",
                    extras: [],
                    },
                    process.env.JWT_KEY,
                    {    
                        expiresIn: "1h"
                    }
               );
                return res.status(200).json({
                    message: 'Auth successful',
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

router.post('/support', (req, res, next) => {
    var numbers = ['+91 83370 63223'];
    var emails = ['support@getto.com'];
    
    res.status(200).json({
        contact_number: numbers,
        email: emails
    });
});

router.post('/aboutus', (req, res, next) => {

    res.status(200).json({
        message1: aboutUs.aboutUsMessage1,
        message2: aboutUs.aboutUsMessage2,
    });
});

router.get('/:userId', (req, res, next) => { 
    const ID = req.params.userId;
    var user = {user:{}};
    User.findById(ID)
    .exec()
    .then(doc => {
      user['user'] = doc;
      console.log(user);
      res.status(200).json(user);
    })
    .catch(err => {
      console.log(err);
      res.status(500).json({
          error: err
      });
    });
});


router.patch('/:userId', geocoding, (req, res, next) => { 
    const id = req.params.userId;
    const updateOps = JSON.parse(req.body); 

    if(req.coordinates != null) {
        updateOps['location']['address_coordinates'] = {"type": "Point", "coordinates": req.coordinates};
    }

    if(updateOps.password) {
        bcrypt.hash(updateOps.password, 10, (err, hash) => {
            updateOps.password = hash
            User.update({_id: id}, { $set: updateOps })
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
        })
    } else {
        User.update({_id: id}, { $set: updateOps })
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

router.delete('/:userId', (req, res, next) => {
    User.remove({_id: req.params.userId})
    .exec()
    .then(result => {
        res.status(200).json({
            message: 'User Deleted'
        });
    })
    .catch(err => {
        console.log(err);
        res.status(500).json({
            error: err
        });
    });
});


module.exports = router;