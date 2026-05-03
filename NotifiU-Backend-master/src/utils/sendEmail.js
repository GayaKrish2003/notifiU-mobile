const nodemailer = require('nodemailer');

// Strict check: if credentials are not configured, crash the server immediately.
if (!process.env.USER_EMAIL || !process.env.USER_PASS) {
    console.error('FATAL ERROR: Email credentials missing. Please set USER_EMAIL and USER_PASS in .env');
    process.exit(1);
}

// Create transporter config globally
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.USER_EMAIL,
        pass: process.env.USER_PASS,
    },
});

const sendEmail = async (email, otp) => {
    const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset OTP</title>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
            body { 
                margin: 0; padding: 0; background-color: #f7f9fc; font-family: 'Inter', system-ui, -apple-system, sans-serif;
            }
            .wrapper {
                width: 100%; table-layout: fixed; background-color: #f7f9fc; padding-bottom: 40px;
            }
            .content {
                max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 20px;
                overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.05); padding: 48px; border: 1px solid #eef2f6;
            }
            .header { text-align: center; margin-bottom: 32px; }
            .brand { font-size: 32px; font-weight: 700; color: #2D3A5D; letter-spacing: -1px; }
            .brand span { color: #FBB017; }
            .title { font-size: 24px; font-weight: 700; color: #1a1a1a; margin-bottom: 12px; }
            .message { font-size: 16px; color: #4b5563; line-height: 24px; margin-bottom: 32px; }
            .otp-container {
                background: linear-gradient(135deg, #fefce8 0%, #fff7ed 100%);
                border: 2px dashed #FBB017; border-radius: 16px; padding: 32px; text-align: center; margin-bottom: 32px;
            }
            .otp-code {
                font-size: 48px; font-weight: 700; color: #2D3A5D; letter-spacing: 12px; margin-right: -12px;
            }
            .expiry { font-size: 14px; color: #9ca3af; margin-top: 12px; }
            .footer { font-size: 13px; color: #9ca3af; line-height: 20px; padding-top: 32px; border-top: 1px solid #f1f5f9; }
            .highlight { color: #FBB017; font-weight: 600; }
        </style>
    </head>
    <body>
        <div class="wrapper">
            <div class="content">
                <div class="header">
                    <div class="brand">notifi<span>U</span></div>
                </div>
                <div class="title">Security Verification</div>
                <div class="message">
                    Hello,<br><br>
                    We received a request to reset the password for your account. Please use the following One-Time Password (OTP) to proceed with your verification.
                </div>
                <div class="otp-container">
                    <div class="otp-code">${otp}</div>
                    <div class="expiry">This code is valid for <span class="highlight">10 minutes</span></div>
                </div>
                <div class="message">
                    If you didn't request this change, you can safely ignore this email. Your password will remain unchanged.
                </div>
                <div class="footer">
                    &copy; ${new Date().getFullYear()} UniStay System. All rights reserved.<br>
                    This is an automated security message, please do not reply.
                </div>
            </div>
        </div>
    </body>
    </html>
  `;

    // Define email options
    const mailOptions = {
        from: `"UniStay Security" <${process.env.USER_EMAIL}>`,
        to: email,
        subject: '🔐 Your Password Reset OTP Code',
        text: `Your password reset OTP is: ${otp}. It expires in 10 minutes.`,
        html: htmlContent,
    };

    try {
        // Send the email
        await transporter.sendMail(mailOptions);
    } catch (err) {
        console.error("Error sending email:", err);
        throw err;
    }
};

module.exports = sendEmail;
