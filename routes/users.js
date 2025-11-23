var express = require('express');
var router = express.Router();
const { checkUser, verifyOTPAndRegister } = require('../controller/userController');

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

router.post('/check', checkUser);
router.post('/verify-otp', verifyOTPAndRegister);

module.exports = router;
