const otpStorage = require('../utils/otpStorage');
const { sendOTPMail } = require('../utils/mailer');


/**
 * Endpoint: POST /forgot-password
 * Validates email, generates OTP, stores it, and sends email.
 */
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }

        // Validate if email exists in dummy array
        const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000);

        // Store in OTPStorage (singleton Map with 5-minute expiry)
        otpStorage.set(email.toLowerCase(), otp);

        // Send Mail
        const mailSent = await sendOTPMail(email, otp);
        if (!mailSent) {
            return res.status(500).json({ message: 'Failed to send OTP email' });
        }

        res.status(200).json({ message: 'OTP sent to your email successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * Endpoint: POST /verify-otp
 * Compares OTP, sets session cookie, returns success.
 */
const verifyOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({ message: 'Email and OTP are required' });
        }

        // Retrieve from storage
        const storedOtp = otpStorage.get(email.toLowerCase());

        if (!storedOtp) {
            return res.status(400).json({ message: 'OTP expired or never requested' });
        }

        // Ensure data types match (convert input to number)
        const providedOtp = Number(otp);

        if (storedOtp === providedOtp) {
            // Success Action: Set cookie
            res.cookie('isLoggedIn', 'true', {
                httpOnly: true,
                maxAge: 3600000, // 1 hour
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'Strict'
            });

            // Clear OTP after successful use
            otpStorage.delete(email.toLowerCase());

            return res.status(200).json({
                success: true,
                message: 'OTP verified successfully. You are now logged in.'
            });
        } else {
            return res.status(401).json({ success: false, message: 'Invalid OTP code' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    forgotPassword,
    verifyOtp
};
