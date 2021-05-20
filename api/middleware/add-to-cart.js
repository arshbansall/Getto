const jwtDecode = require('jwt-decode');
const jwt = require('jsonwebtoken');

const Product = require('../models/product');

module.exports = (req, res, next) => {

    const productId = req.params.productId;
    const qty = req.query.qty;
    var token = req.headers.authorization.split(" ")[1]; 

    var cart = jwtDecode(token, process.env.JWT_KEY);
    var itemsArray = [];

    this.generateToken = function(totalPrice, totalQty, itemsList) {
        var extras = [{Delivery: 30}, {Taxes: 20}];
        if(totalPrice > 10000) {

            if(cart.extras.length != 0 ) {
                for(var i = 0; i < extras.length; i++) {
                    var key = Object.keys(extras[i])[0];
                    totalPrice -= +extras[i][key];
                }
            }

            token = jwt.sign({
                user: {
                    email: cart.user.email,
                    _id: cart.user._id
                },
                items : itemsList,
                extras: [],
                total_price: totalPrice,
                total_Qty : +totalQty
            }, 
            process.env.JWT_KEY,
            {
                expiresIn: "24h"
            });
            return token; 
        } else {

            if(cart.extras.length == 0 ) {
                for(var i = 0; i < extras.length; i++) {
                    var key = Object.keys(extras[i])[0];
                    totalPrice += +extras[i][key];
                }
            }

            token = jwt.sign({
                user: {
                    email: cart.user.email,
                    _id: cart.user._id
                },
                items : itemsList,
                extras: extras,
                total_price: totalPrice,
                total_Qty : +totalQty
            }, 
            process.env.JWT_KEY,
            {
                expiresIn: "24h"
            });
            return token; 
        }
    };

    this.addToCart = async function() {

        var product = {};
        product = await Product.findById(productId);
        
        console.log(product);

        if(cart.items !== "items"){
            for(var x of cart.items) {
                itemsArray.push(x);
            }
        }

        if(itemsArray[0] === undefined) {
            itemsArray.push({
                name: product.name,
                id: productId,
                price: product.discounted_price,
                productType: product.product_category,
                images: product.images[0],
                qty: +qty
            });
            req.token = this.generateToken(qty * itemsArray[0].price, qty, itemsArray);
            next();
        } else {
            for(var i = 0; i < itemsArray.length; i++) {
                if(itemsArray[i].id == productId) {
                    itemsArray[i].qty = +itemsArray[i].qty + +qty; 
                    var price = cart.total_price + (itemsArray[i].price * qty);
                    var totalQty = +cart.total_Qty + +qty; 
                    req.token = this.generateToken(price, totalQty, itemsArray);
                    next();
                }
            }
            itemsArray.push({
                name: product.name,
                id: productId,
                price: product.discounted_price,
                productType: product.product_category,
                images: product.images[0],
                qty: +qty,
            });
            price = cart.total_price + (product.discounted_price * qty);
            totalQty = +cart.total_Qty + +qty;
            req.token = this.generateToken(price, totalQty, itemsArray);
            next();
        }
    }
    this.addToCart();
}