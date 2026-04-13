const express = require('express');
const { forgotPassword, verifyOTP, resetPassword } = require('../controllers/authController');

const router = express.Router();

// POST /api/auth/forgot-password
router.post('/forgot-password', forgotPassword);

// POST /api/auth/verify-otp
router.post('/verify-otp', verifyOTP);

// POST /api/auth/reset-password
router.post('/reset-password', resetPassword);

module.exports = router;
