const mongoose = require('mongoose');

const userSchema = mongoose.Schema({

    _id: String,
    name: {type: String, required: true}, 
    device_token: String,

    email: { 
        type: String, 
        required: true, 
        unique: true,
        match: /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])/
    },

    password: {type: String, required: true}, 
    phone_number: {type: Number, required: true},

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
    }
});

module.exports = mongoose.model('User', userSchema);
