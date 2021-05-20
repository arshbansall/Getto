/*
Push Notification Types: 

'NotifyOrder': Notifes the store owner that they have recieved a new order. 
'OrderAccepted': Notifies the customer that the store has accepted the order. 

*/ 

const admin = require('firebase-admin');
const Store = require('../models/store');
const serviceAccount = require('../constants/getto-getittoday-firebase-adminsdk-amfjq-dca292d341.json');
const User = require('../models/user');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

module.exports = async function sendNotification(data, type) {

    if(type == 'NotifyOrder') {
        for(var store of data.store) {
            var tokens = [];
            var payload = {
                "notification": {
                    "title": "Congratulations! " + store.name,
                    "body": "You've got a new Order! Please accept it as soon as possible.",
                    "sound": "default"
                },
                "data": {
                    "sendername": "Getto, Inc.",
                    "message": "You've got a new Order! Please accept it as soon as possible."
                }
            }
            tokens.push(store.device_token);

            admin.messaging().sendToDevice(tokens, payload).then((response) => {
                console.log('Pushed Message');
            }).catch((err) => {
                console.log(err);
            });
        }
        return 1; 

    } else if(type === 'OrderAccepted') {
        var user = await User.findById(data);
        var tokens = [];
            var payload = {
                "notification": {
                    "title": "Getto, Inc.",
                    "body": "Your Order has been accepted. Package will be delivered within 2 hours.",
                    "sound": "default"
                },
                "data": {
                    "sendername": "Getto, Inc.",
                    "message": "Order Accpeted"
                }
            }
            tokens.push(user.device_token);

            admin.messaging().sendToDevice(tokens, payload).then((response) => {
                console.log('Pushed Message');
            }).catch((err) => {
                console.log(err);
            });
            
    } else {
        return 0; 
    }
    
}
