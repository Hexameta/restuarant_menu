var express = require('express');
const { Branch } = require('../model/resturantModel');
const { Category } = require('../model/categoryModal');
const { MenuItem } = require('../model/menuItemModal');
const { OTPValidate } = require('../model/otpValidateModal');
const { SpecialTag, SpecialTagItem } = require('../model/specialTagModal');
const { User } = require('../model/userModel');
const { Ads } = require('../model/adsModal');

var router = express.Router();
/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

module.exports = router;
