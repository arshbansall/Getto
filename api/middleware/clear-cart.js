const jwtDecode = require('jwt-decode');
const jwt = require('jsonwebtoken');
const User = require('../models/user');

module.exports = async (req, res, next) => {

    var oldToken = req.headers.authorization.split(" ")[1]; 
    var cart = jwtDecode(oldToken, process.env.JWT_KEY);

    var user = await User.findById(cart.user._id);

    req.token = jwt.sign({
        user : {
            _id: user._id,
            name: user.name,
            email: user.email,
            password: user.password,
            location: {
                address_line1: user.location.address_line1, 
                address_line2: user.location.address_line2,
                pin_code: user.location.pin_code,
                city: user.location.city
            },
            phone_number: user.phone_number,
        },
        items : "items",
        extras: [],
        },
        process.env.JWT_KEY,
        {    
            expiresIn: "1h"
        }
   );
   next();
}