const User = require('../models/user');
const sendEmail = require('../utils/sendEmail');

// @desc    Forgot Password (Send OTP)
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Generate a 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Save OTP + expiry; clear any previous verified state
        user.resetPasswordOTP = otp;
        user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
        user.resetPasswordVerified = false;

        await user.save({ validateBeforeSave: false });

        try {
            await sendEmail(user.email, otp);
            return res.status(200).json({ success: true, message: 'OTP sent to email' });
        } catch (error) {
            console.error('Email sending failed:', error);
            user.resetPasswordOTP = undefined;
            user.resetPasswordExpire = undefined;
            user.resetPasswordVerified = false;
            await user.save({ validateBeforeSave: false });
            return res.status(500).json({ success: false, message: 'Email could not be sent' });
        }
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Verify OTP
// @route   POST /api/auth/verify-otp
// @access  Public
exports.verifyOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;

        const user = await User.findOne({
            email,
            resetPasswordOTP: otp,
            resetPasswordExpire: { $gt: Date.now() },
        });

        if (!user) {
            return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
        }

        // Clear the OTP and mark as verified — resetPassword will check this flag
        user.resetPasswordOTP = undefined;
        user.resetPasswordVerified = true;
        await user.save({ validateBeforeSave: false });

        return res.status(200).json({ success: true, message: 'OTP verified successfully' });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Reset Password
// @route   POST /api/auth/reset-password
// @access  Public
exports.resetPassword = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email and new password are required' });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Security guard: OTP must have been verified in this session first
        if (!user.resetPasswordVerified) {
            return res.status(403).json({
                success: false,
                message: 'OTP verification is required before resetting your password.',
            });
        }

        // Guard: expiry window must still be valid
        if (!user.resetPasswordExpire || user.resetPasswordExpire < Date.now()) {
            user.resetPasswordVerified = false;
            await user.save({ validateBeforeSave: false });
            return res.status(400).json({
                success: false,
                message: 'Password reset session has expired. Please request a new OTP.',
            });
        }

        // Update password (mongoose pre-save hook hashes it)
        user.password = password;

        // Clear all OTP/reset fields
        user.resetPasswordOTP = undefined;
        user.resetPasswordExpire = undefined;
        user.resetPasswordVerified = false;

        await user.save();

        return res.status(200).json({ success: true, message: 'Password reset successful' });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Server Error' });
    }
};
