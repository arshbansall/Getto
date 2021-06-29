const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const mongoose = require('mongoose');
const Product = require('../models/product');
const getDeliveryTime = require('../middleware/get-estimated-delivery-time');
const jwtDecode = require('jwt-decode');
const checkAuth = require('../middleware/check-auth');

const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, './uploads');
    },
    filename: function(req, file, cb) {
        cb(null, new Date().toISOString() + file.originalname);
    }
});

const fileFilter = (req, file, cb) => {
    cb(null, true);
}

const upload = multer({
    storage: storage, 
    fileFilter: fileFilter
});

router.post('/', upload.array('images', 10), (req, res, next) => {
    var productImagesPath = [];
    
    for(const image in req.files) {
        productImagesPath.push(req.files[image].path)
    }
   
    const data = req.body;

    const product = new Product({
        _id: new mongoose.Types.ObjectId,
        name: data.name,
        seller: data.seller,

        approval_status: "Approval Pending",
        listing: false,

        highlights: data.highlights,
        images: productImagesPath,
        specifications: data.specifications,

        description: data.description,

        mrp: +data.mrp,
        warehouse_qty: +data.warehouse_qty ,
        discounted_price: +data.discounted_price,
        total_sold: 0,

        product_category: data.product_category,
        sub_category: data.sub_category,
        core_type: data.core_type,

    });
    product
    .save()
    .then(result => {
        console.log(result);
        res.status(201).json({
            message: "Product Posted Sucessfully"
        });
    })
    .catch(err => {
        console.log(err);
        res.status(500).json({
            error: err
        });
    });
});

router.get('/hot', async (req, res, next) => {
    const categories = ["Electronics", "Fashion", "Home Appliances", "Watches", "Mobiles", "Stationery"];
    const images = [
        {
            "image_id": "WATCH.png",/*"2021-05-16T08:56:11.659Zimage0.jpg",*/
            "product_id": "5f533072a1a094bdc298f7dd"
        },
        {
            "image_id": "2020-09-04T21:00:14.154Zwatch.jpg",
            "product_id": "5f533072a1a094bdc298f7dd"
        },
        {
            "image_id": "2020-09-04T21:00:14.154Zwatch.jpg",
            "product_id": "5f533072a1a094bdc298f7dd"
        },
        {
            "image_id": "2020-09-04T21:00:14.154Zwatch.jpg",
            "product_id": "5f533072a1a094bdc298f7dd"
        }
    ];
    var hot_categories = [
        {'Fashion': []}, 
        {'Electronics': []}
    ];
    for(const [i, category] of hot_categories.entries()) {
        const key = Object.keys(hot_categories[i]);
        
        var query = {product_category: key, listing: true};
        var products = await Product.find(query).sort({total_sold: -1}).limit(5);
        hot_categories[i][key] = products;
    }
    res.status(201).json({
        categories: categories,
        images: images,
        hot_categories: hot_categories
    });
});

router.get('/category/:category', (req, res, next) => {
    const category = req.params.category;
    const query = {product_category: category, listing: true};

    Product
    .find(query)
    .exec()
    .then(docs => {
        const response = {
            count: docs.length,
            [category]: docs
        }
        res.status(201).json(response);
    })
    .catch(err => {
        console.log(err);
        res.status(500).json({
            error: err
        });
    });

});

router.get('/:productId', checkAuth, (req, res, next) => { 
    const ID = req.params.productId;
    
    Product.findById(ID)
    .exec()
    .then(async doc => {
      let deliveryTime = "N/A";

      if(req.userData != "Unauthourized") {
        var token = req.headers.authorization.split(" ")[1]; 
        var user = jwtDecode(token, process.env.JWT_KEY);
        await getDeliveryTime(doc.seller, user.user._id).then((data) => {
            deliveryTime = data;
        });
      }

      res.status(200).json({
        product: doc,
        estd: deliveryTime
      });
    })
    .catch(err => {
      console.log(err);
      res.status(500).json({
          error: err
      });
    });
});

router.get('/seller/:id', (req, res, next) => {
    const id = req.params.id;
    const status = req.query.status;
    const query = {seller: id, approval_status: status}

    Product
    .find(query)
    .exec()
    .then(docs => {
        const response = {
            count: docs.length,
            products: docs
        };
        res.status(201).json(response);
    })
    .catch(err => {
        console.log(err);
        res.status(500).json({
            error: err
        });
    });
});

router.post('/product-categories', (req, res, next) => {
    const categories = {
        "Electronics": ["T.V.", "SmartPhone", "Charging Cable", "Transfer Cable", "Gaming Console"],
        "Cosmetics": ["Lipstick", "Blush", "Eye Lash Maker", "BB Cream"]
    };

    res.status(201).json({
        categories: categories
    });
})

router.post('/search', (req, res, next) => {
    const regex = new RegExp(escapeRegex(req.query.search), 'gi');
    const query = {
        listing: true,
        $or: [{name: regex },{product_category: regex},{core_type: regex},{sub_category: regex}] 
    };
    
    Product
    .find(query)
    .exec()
    .then(docs => {
        const response = {
            count: docs.length,
            products: docs
        };
        res.status(201).json(response);
    })
    .catch(err => {
        console.log(err);
        res.status(500).json({
            error: err
        });
    });
});

router.post('/autocomplete', (req, res, next) => {
    var regex = RegExp(req.query['term'], 'i');
    const query = {
        listing: true,
        $or: [{name: regex },{product_category: regex},{core_type: regex},{sub_category: regex}] 
    };
    
    Product
    .find(query)
    .sort({"updated_at": -1})
    .sort({"created_at": -1})
    .limit(5)
    .select('name _id product_category')
    .exec()
    .then(docs => {
        const response = {
            count: docs.length,
            products: docs.map(doc => {
                return {
                    _id: doc._id,
                    name: doc.name,
                    product_category: doc.product_category
                }
            })
        };
        res.status(201).json(response);
    })
    .catch(err => {
        console.log(err);
        res.status(500).json({
            error: err
        });
    });
});

router.patch('/:productId', (req, res, next) => {
    const id = req.params.productId;
    const updateOps = JSON.parse(req.body);

    Product.update({_id: id}, { $set: updateOps })
    .exec()
    .then(result => {
        res.status(200).json(result);
    })
    .catch(err => {
        console.log(err);
        res.status(500).json({
            error: err
        });
    }); 
});


router.delete('/:productId', (req, res, next) => {
    const id = req.params.productId;
    Product.remove({_id: id})
    .exec()
    .then(result => {
        res.status(200).json(result);
    })
    .catch(err => {
        console.log(err);
        res.status(500).json({
            error: err
        });
    }); 
});

function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

module.exports = router;