const express = require('express');
const router = express.Router();
const { forgotPassword, verifyOtp } = require('../controllers/authFlowController');

router.post('/forgot-password', forgotPassword);
router.post('/verify-otp', verifyOtp);

module.exports = router;
