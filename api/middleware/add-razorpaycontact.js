const fetch = require('node-fetch');

module.exports = (req, res, next) => {

    const data = JSON.parse(req.body);
    const auth = "Basic " + new Buffer(process.env.RAZORPAY_API_KEY + ":" + process.env.RAZORPAY_KEY_SECRET).toString("base64");

    const contactDetails = JSON.stringify({
        "name": data.bank_details.account_holder_name,
        "email": data.owner.email,
        "contact": data.bank_details.account_holder_contact,
        "type": "vendor",
        "reference_id": `${data.bank_details.account_holder_contact}`
    });

    const contactOptions = {
        body: contactDetails,
        method: 'POST', 
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': contactDetails.length,
            'Authorization': auth
        }
    }

    fetch("https://api.razorpay.com/v1/contacts", contactOptions)
    .then(res => res.json())
    .then(contact => {
        var fundAccountDetails;

        if(data.payout_method == "IMPS") {
            fundAccountDetails = JSON.stringify({
                "contact_id": contact.id,
                "account_type": "bank_account",
                "bank_account": {
                    "name": data.bank_details.account_holder_name,
                    "ifsc": data.bank_details.IFSC_code,
                    "account_number": data.bank_details.bank_account
                }
            });
        } else if (data.payout_method == "UPI"){
            fundAccountDetails = JSON.stringify({
                "contact_id": contact.id,
                "account_type": "vpa",
                "vpa": {
                    "address": data.bank_details.upi,
                }
            });
        }
    

        const fundOptions = {
            body: fundAccountDetails,
            method: 'POST', 
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': contactDetails.length,
                'Authorization': auth
            }
        } 

        fetch("https://api.razorpay.com/v1/fund_accounts", fundOptions)
        .then(res => res.json())
        .then(result => {
            req.result = result
            next();
        })
        .catch(err => {
            console.log(err);
            next();
        })
    })
    .catch(err => {
        console.log(err);
        next();
    })

}