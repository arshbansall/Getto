const mongoose = require('mongoose');

const storeSchema = mongoose.Schema({

    _id: String,
    razorpay_id: String,
    razorpay_fund_id: String,
    device_token: String,

    name: {type: String, required: true},

    email: { 
        type: String, 
        required: true, 
        unique: true,
        match: /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])/
    },

    password: {type: String, required: true}, 

    owner: {
        name: {type: String, required: true},
        contact_number: {type: Number, required: true},
        email: { 
            type: String, 
            required: true, 
            unique: true,
            match: /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])/
        }
    },

    location: {
        address_line1: {type: String, required: true}, 
        address_line2: {type: String, required: true}, 

        address_coordinates: {
            type: {
                type: String, // Don't do `{ location: { type: String } }`
                enum: ['Point'], // 'location.type' must be 'Point'
                required: true,
                default: 'Point'
            },
            coordinates: {
                type: [Number],
                index: '2dsphere'
            }
        },

        pin_code: {type: Number, required: true},
        city: {type: String, required: true}
    },

    store_contact_number: {type: Number, required: true},
    total_sales: {type: Number},
    total_revenue: {type: Number},
    payout_method: {type: String, enum: ["UPI", "IMPS"]},

    working_days: {type: [String], required: true},
    opening_time: {type: [String], required: true},
    closing_time: {type: [String], required: true},

    bank_details: {type: Object},

    daily_rs_data: {type: [{
        date: String,
        sales: Number, 
        revenue: Number
    }]},
});

module.exports = mongoose.model('Store', storeSchema);