const fetch = require('node-fetch');
const Store = require('../models/store');
const razorpayFundAccountUpdate = require('../middleware/update-razorpayfund');

module.exports = async (req, res, next) => {
    
    const updateOps = JSON.parse(req.body); 

    if(updateOps.owner == undefined && updateOps.bank_details == undefined) {
        req.parsedUpdateData = updateOps;
        next();
    } else {
        const storeID = req.params.storeId;
        const auth = "Basic " + new Buffer(process.env.RAZORPAY_API_KEY + ":" + process.env.RAZORPAY_KEY_SECRET).toString("base64");

        const store = await Store.findById(storeID);

        const razorpayContactID = store.razorpay_id; 
        var updateData = {};
        let url = `https://api.razorpay.com/v1/contacts/${razorpayContactID}`;

        updateData["email"] = updateOps['owner']['email'] ? updateOps['owner']['email'] : store.owner.email;
        updateData["contact"] = updateOps['bank_details']['account_holder_contact'] ? updateOps['bank_details']['account_holder_contact'] : store.bank_details.account_holder_contact;
        updateData["reference_id"] = updateOps['bank_details']['account_holder_contact'] ? updateOps['bank_details']['account_holder_contact'].toString() : `${store.bank_details.account_holder_contact}`;
        updateData["name"] = updateOps['bank_details']['account_holder_name'] ? updateOps['bank_details']['account_holder_name'] : store.bank_details.account_holder_name;

        if(Object.keys(updateOps["bank_details"]).length != 0 && (updateOps['bank_details']['upi'] != store.bank_details.upi || updateOps['bank_details']['bank_account'] != store.bank_details.bank_account || updateOps['bank_details']['IFSC_code'] != store.bank_details.IFSC_code)) 
            var fundAccoutData = await razorpayFundAccountUpdate(store, auth, updateOps["bank_details"]);

        if(Object.keys(updateOps["owner"]).length != 0) {
            delete updateOps["bank_details"];
        } else if(Object.keys(updateOps["bank_details"]).length != 0) {
            delete updateOps["owner"];
        }

        req.parsedUpdateData = updateOps;

        updateData['type'] = "vendor";
        updateData = JSON.stringify(updateData);

        const updateOptions = {
            body: updateData,
            method: 'PATCH', 
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': updateData.length,
                'Authorization': auth
            }
        }

        fetch(url, updateOptions)
        .then(res => console.log(res.json()))
        .then(contact => {
            next();
        })
        .catch(err => {
            console.log(err);
            next();
        });
    }
    
}