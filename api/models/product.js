const mongoose = require('mongoose');

const productSchema = mongoose.Schema({

    _id: String,

    name: {type: String, required: true}, 

    approval_status: {type: String, default: "Approval Pending"}, 
    listing: Boolean, 

    seller: {type: String, ref: 'Store', required: true}, 
    warehouse_qty: {type: Number, required: true}, 

    highlights: {type: [String]},
    specifications: {type: Object, required: true}, 
    description: {type: String, required: true}, 

    mrp: {type: Number, required: true}, 
    images: {type: [String], required: true}, 
    discounted_price: {type: Number, required: true}, 

    product_category: {type: String, required: true},
    sub_category: {type: String, required: true},
    core_type: {type: String, required: true}, 

    total_sold: {type: Number, required: true}, 

});

module.exports = mongoose.model('Product', productSchema);
