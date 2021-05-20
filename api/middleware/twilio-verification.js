const client = require("twilio")(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

exports.generateOTP = function generateOTP(contact) {

    client
    .verify
    .services(process.env.TWILIO_VERIFY_SERVICEID)
    .verifications
    .create({
        to: `+91${contact}`,
        channel: 'sms'
    })
    .then((data) => {
        return data;
    });

};

exports.verifyOTP = (req, res, next) => {

    const phonenumber = req.query.phonenumber;
    const otp = req.query.code;

    client
    .verify
    .services(process.env.TWILIO_VERIFY_SERVICEID)
    .verificationChecks
    .create({
        to: `+91${phonenumber}`,
        code: otp
    })
    .then((data) => {
        //console.log(data);
        if(data["status"] == "approved") {
            req.data = data;
            next();
        } else {
            res.status(401).json({data: data});
        }
    })
    .catch(err => {
        console.log(err);
        res.status(500).json({error: err});
    });

};

