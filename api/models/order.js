const mongoose = require('mongoose');

const orderSchema = mongoose.Schema({
    
    _id: String,

    customer: {type: Object, ref: 'User', required: true},

    store: {type: [Object], ref: 'Store', required: true},

    order_date: {type:Date, required:true},
    delivery_date: {type: Date},

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

    order_status: {
        type: String,
        enum: ['Receive', 'Accepted', 'Enroute', 'Delivered', 'Cancelled']
    },

    total_price: {type: Number, required: true},

    getto_service_charge:  {type: String, required: true},

    payment: {
        payment_method: {
            type: String,
            enum: ['COD', 'Online'], 
            required: true
        },
        paymentID: String
    },

});

module.exports = mongoose.model('Order', orderSchema);