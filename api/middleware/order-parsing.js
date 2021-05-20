const jwt = require('jsonwebtoken');
const Product = require('../models/product');
const Store = require('../models/store');

module.exports = async (req, res, next) => {

    var token = req.headers.authorization.split(" ")[1];
    const cartData = jwt.decode(token);
    var product = {};
    var storeId;

    var storeArray = []; 
    var store = {};

    async function findStore(id) {
        store = await Store.findById(id);
        store = {
            id: store._id,
            name: store.name,
            address_line1: store.location.address_line1,
            address_line2: store.location.address_line2,
            city: store.location.city,
            pin_code: store.location.pin_code,
            shop_contact: store.store_contact_number,
            owner_contact: store.owner.contact_number,
            ordered_products: [],
            device_token: store.device_token, 
            qty: 0,
            payout: "Pending",
            billing_amount: 0
        };
        return store;
    }

    async function updateStoreData(item, id) {
        var revenue = item.price * item.qty * process.env.GETTO_SERVICE_CHARGE_CALC;
        await Store.findOneAndUpdate({_id: id}, {$inc : {'total_sales': item.qty, 'total_revenue': revenue}});
    }

    for(var item of cartData.items) {
        var storeData = {};
        var storeFound = false;
        product = await Product.findById(item.id);
        storeId = product.seller; 

        for(var store of storeArray) {
            if(store.id === storeId) {
                store.ordered_products.push(item);
                store.qty += +item.qty;
                store.billing_amount += (item.qty * item.price);

                storeFound = true;
                await updateStoreData(item, storeId);
                break;
            } 
        }

        if(!storeFound) {
            storeData = await findStore(storeId);

            storeData.ordered_products.push(item);
            storeData.qty += +item.qty;
            storeData.billing_amount += (item.qty * item.price);

            storeArray.push(storeData);
            await updateStoreData(item, storeId);
        }

        await Product.findOneAndUpdate({_id: item.id}, {$inc : {'total_sold': item.qty}});
    }
    req.storeArray = storeArray;
    req.customerId = cartData.user._id;
    req.total_price = cartData.total_price;
    next();

}