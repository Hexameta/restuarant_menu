var express = require('express');
const { addRestaurant } = require('../controller/companyController');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

router.post('/add-restuarant',addRestaurant)

module.exports = router;
