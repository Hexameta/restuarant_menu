var express = require('express');
const { Branch } = require('../model/resturantModel');
const { Category } = require('../model/categoryModel');
const { MenuItem } = require('../model/menuItemModel');
const { OTPValidate } = require('../model/otpValidateModel');
const { SpecialTag, SpecialTagItem } = require('../model/specialTagModel');
const { User } = require('../model/userModel');
const { Ads } = require('../model/adsModal');

var router = express.Router();
/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

module.exports = router;
