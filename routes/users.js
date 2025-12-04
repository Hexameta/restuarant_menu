var express = require('express');
var router = express.Router();
const { checkUser, verifyOTPAndRegister,signin } = require('../controller/userController');
const { refreshToken } = require('../controller/refreshTokenController');

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

router.post('/check', checkUser);
router.post('/verify-otp', verifyOTPAndRegister);
router.post('/signin', signin);
router.post('/refresh-token', refreshToken);

module.exports = router;
