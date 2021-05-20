const fetch = require('node-fetch');

module.exports = (req, res, next) => {
    const data = JSON.parse(req.body);
    //console.log(data.location);
    //console.log(data); Object.keys(data.location).length === 0

    if(data.location === undefined || data.location === null) {
        next();
    } else {
        var address_line1 = data.location.address_line1;
        var address_line2 = data.location.address_line2;
        var city = data.location.city;

        let url = `https://maps.googleapis.com/maps/api/geocode/json?address=${address_line1},+${address_line2},+${city}&key=${process.env.GOOGLE_MAPS_API_KEY}`;

        fetch(url)
        .then(response => response.json())
        .then(data => {
            req.coordinates = [data.results[0].geometry.location.lng, data.results[0].geometry.location.lat];
            //console.log(req.coordinates);
            next();
        })
        .catch(err => console.log(err.message));
    }
}