const express = require('express');
const router = express.Router();
const addToCart = require('../middleware/add-to-cart');
const removeFromCart = require('../middleware/remove-from-cart');
const clearCart = require('../middleware/clear-cart');


router.get('/add-to-cart/:productId', addToCart, (req, res, next) => {
    res.status(200).json({
        token: req.token
    });
});

router.get('/remove-from-cart/:productId', removeFromCart, (req, res, next) => {
    res.status(200).json({
        token: req.token
    });
});

router.get('/clear-cart', clearCart, (req, res, next) => {
    res.status(200).json({
        token: req.token
    });
});

module.exports = router;