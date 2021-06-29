const express = require('express')
const app = express();
const morgan = require('morgan');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const productRoutes = require('./api/routes/products');
const ordersRoutes = require('./api/routes/orders');
const userRoutes = require('./api/routes/users');
const storeRoutes = require('./api/routes/stores');
const cartRoutes = require('./api/routes/cart');
const monthlySales = require('./api/middleware/monthlysales');

mongoose.connect('mongodb+srv://arshbansal:'+ process.env.MONGO_ATLAS_PW + '@getto.k9v18.mongodb.net/getto?retryWrites=true&w=majority', {
    useNewUrlParser: true
});
mongoose.Promise = global.Promise;

//monthlySales();
app.use(morgan('dev'));
app.use('/uploads', express.static('uploads'));
app.use('/policy_files', express.static('policy_files'));
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.text());

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Orgin", "*");
    res.header("Access-Control-Allow-Headers", 
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
    );
    if(req.method === 'OPTIONS') {
        res.header('Access-Control-Allow-Methods', 'PUT, POST, PATCH, DELETE, GET');
        return res.status(200).json({});
    }
    next();
});

app.use('/products', productRoutes);
app.use('/orders', ordersRoutes);
app.use('/users', userRoutes);
app.use('/stores', storeRoutes);
app.use('/cart', cartRoutes);

app.use((req, res, next) => {
    const error = new Error('Not Found');
    error.status = 404;
    next(error);
})

app.use((error ,req, res, next) => {
    res.status(error.status || 500);
    res.json({
        error: {
            message: error.message
        }
    });
});

module.exports = app; 