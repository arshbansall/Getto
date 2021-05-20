const Order = require('../models/order');

module.exports = async function generatePayID() {
    var _sym = 'abcdefghijklmnopqrstuvwxyz1234567890';
    var str = 'COD';
    let ID;
    
    for(var i = 0; i < 8; i++) {
        str += _sym[parseInt(Math.random() * (_sym.length))];
    }

    ID = await Order.findOne({'payment.paymentID': str});
    
    if(ID == null) {
        return str;
    } else {
        generatePayID();
    }
}