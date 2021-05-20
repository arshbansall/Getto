const jwtDecode = require('jwt-decode');
const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {

    const productId = req.params.productId;
    var token = req.headers.authorization.split(" ")[1]; 

    var cart = jwtDecode(token, process.env.JWT_KEY);
    var itemsArray = [];

    this.generateToken = function(totalPrice, totalQty, itemsList) {
        var extras = [{Delivery: 30}, {Taxes: 20}];
        if(itemsList.length == 0) {
            totalPrice = 0;
            extras = [];
        }
        if(totalPrice > 10000) {
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

            if(cart.extras.length == 0) {
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

    this.delete = function() {

        if(cart.items !== "items"){
            for(var x of cart.items) {
                itemsArray.push(x);
            }
        }

        for(var i = 0; i < itemsArray.length; i++) {
            if(itemsArray[i].id == productId) {
                var price = cart.total_price - (itemsArray[i].price * itemsArray[i].qty);
                var totalQty = cart.total_Qty - itemsArray[i].qty; 
                itemsArray.splice(i, 1)
                req.token = this.generateToken(price, totalQty, itemsArray);
                next();
            }
        }
    }
    this.delete();
}