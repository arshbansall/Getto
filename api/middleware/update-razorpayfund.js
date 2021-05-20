const fetch = require('node-fetch');
const Store = require('../models/store');

async function fund_accounts_controller(boolValue, fundAccountID, authentication) {
    const url = `https://api.razorpay.com/v1/fund_accounts`;
    const fundAccountControllerData = JSON.stringify({"active": boolValue});
    var data;

    const fundAccountControllerOptions = {
        body: fundAccountControllerData,
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': fundAccountControllerData.length,
            'Authorization': authentication
        }
    };

    await fetch(`${url}/${fundAccountID}`, fundAccountControllerOptions)
    .then(res => res.json())
    .then(contact => {
        data = contact;
    })
    .catch(err => {
        data = err;
    });

    return data;

}

module.exports = async function update_razorpay_fund_account(storeData, authentication, bankDetails) {

    const razorpayFundAccountsUrl = `https://api.razorpay.com/v1/fund_accounts`;
    var fundAccounts = [];
    var found = false;
    let headers = new fetch.Headers();
    var activationData;
    headers.append("Accept", "application/json");
    headers.append("Authorization", authentication);
    let request = new fetch.Request(`${razorpayFundAccountsUrl}?contact_id=${storeData.razorpay_id}`,{
        method: "GET",
        headers: headers
    });

    await fetch(request)
    .then(response => response.json())
    .then(data => {
        fundAccounts = data["items"];
    })
    .catch(err => console.log(err));

    if(storeData.payout_method == "UPI") {

        for(const fundAccount of fundAccounts) {
            if(bankDetails["upi"] === fundAccount["vpa"]["address"] && fundAccount["active"] === false) {
                found = true;

                const deactivationData = await fund_accounts_controller(false, storeData.razorpay_fund_id, authentication);
                activationData = await fund_accounts_controller(true, fundAccount["id"], authentication);

                if(activationData["id"]) 
                    await Store.findOneAndUpdate({_id: storeData._id}, {$set: {"razorpay_fund_id": fundAccount["id"]}});
                    return 1;

                break;
            }
        }

        if(!found) {
            const upiFundAccountData = JSON.stringify({
                "account_type": "vpa",
                "contact_id": storeData.razorpay_id,
                "vpa": {
                    "address": bankDetails["upi"]
                }
            });

            const upiFundOptions = {
                body: upiFundAccountData,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': upiFundAccountData.length,
                    'Authorization': authentication
                }
            }

            await fund_accounts_controller(false, storeData.razorpay_fund_id, authentication);

            await fetch(razorpayFundAccountsUrl, upiFundOptions)
            .then(async result => result.json())
            .then(async contact => {
                await Store.findOneAndUpdate({_id: storeData._id}, { $set: {"razorpay_fund_id": contact.id}});
                return 1;
            })
            .catch(err => {
                return err;
            });
        }

    } else if(storeData.payout_method === "IMPS") { //Test IMPS update in Razorpay

        for(const fundAccount of fundAccounts) {
            var account = fundAccount["bank_account"];
            if (bankDetails["IFSC_code"] === account["ifsc"] && bankDetails["bank_account"] === account["account_number"] && bankDetails["account_holder_name"] === account["name"] && account["active"] === false) {
                found = true;

                const deactivationData = await fund_accounts_controller(false, storeData.razorpay_fund_id, authentication);
                activationData = await fund_accounts_controller(true, fundAccount["id"], authentication);

                if(activationData["id"]) 
                    await Store.findOneAndUpdate({_id: storeData._id}, {$set: {"razorpay_fund_id": fundAccount["id"]}});
                    return 1;

                break;
            } 
        }

        if (!found) {
            const bankAccountData = JSON.stringify({
                "account_type": "bank_account",
                "contact_id": storeData.razorpay_id,
                "bank_account": {
                    "name": bankDetails["account_holder_name"],
                    "account_number": bankDetails["bank_account"],
                    "ifsc": bankDetails["IFSC_code"]
                }
            });

            const bankAccountOptions = {
                body: bankAccountData,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': bankAccountData.length,
                    'Authorization': authentication
                }
            }

            await fund_accounts_controller(false, storeData.razorpay_fund_id, authentication);

            await fetch(razorpayFundAccountsUrl, bankAccountOptions)
            .then(async result => result.json())
            .then(async contact => {
                await Store.findOneAndUpdate({_id: storeData._id}, { $set: {"razorpay_fund_id": contact.id}});
                return 1;
            })
            .catch(err => {
                return err;
            });
        }

    }

}