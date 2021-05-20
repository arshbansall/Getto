const fetch = require('node-fetch');
const User = require('../models/user');
const Store = require('../models/store');

module.exports = async function getDeliveryTime(sellerID, userID) {
    if(userID.length <= 0) {
        return "User Location Not Available";
    } else {
        const store = await Store.findById(sellerID);
        const user = await User.findById(userID);

        const storeLongitude = store.location.address_coordinates.coordinates[0];
        const storeLattitude = store.location.address_coordinates.coordinates[1];

        const userLongitude = user.location.address_coordinates.coordinates[0];
        const userLattitude = user.location.address_coordinates.coordinates[1];

        let url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${storeLattitude},%20${storeLongitude}&destinations=${userLattitude},%20${userLongitude}&key=${process.env.GOOGLE_MAPS_API_KEY}`;

        return fetch(url)
        .then(response =>{
            return response.json().then((data) => {
                console.log(data["rows"][0]["elements"][0]);
                return data["rows"][0]["elements"][0]["duration"]["text"];
            })
            .catch(err => {
                console.log(err.message);
                return "Data Not Available";
            })
        });
    }
}