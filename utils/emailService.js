const axios = require("axios");
require("dotenv").config();

/**
 * Sends an OTP email using the Brevo (formerly Sendinblue) REST API.
 * @param {string} email - Recipient email address.
 * @param {string} otp - 6-digit One Time Password.
 * @returns {Promise<Object>} - Brevo API response status.
 */
const sendOtpEmail = async (email, otp) => {
    const apiKey = process.env.BREVO_API_KEY;
    const senderEmail = process.env.EMAIL_FROM || "noreply@fundwise.com";
    const senderName = process.env.EMAIL_FROM_NAME || "FundWise Support";

    // 1. Check if Brevo API Key is set
    if (!apiKey || apiKey.includes("your_brevo_api_key_here")) {
        console.warn("\n[DEV MODE] Brevo API Key not set. Bypassing real email sending...");
        console.log(`[OTP LOG] Recipient: ${email} | Code: ${otp} | Expires in 10 mins\n`);
        return { success: true, bypassed: true };
    }

    // 2. Prepare payload for Brevo Transactional Email API
    const data = {
        sender: {
            name: senderName,
            email: senderEmail
        },
        to: [
            {
                email: email
            }
        ],
        subject: "Verify Your FundWise Account",
        htmlContent: `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: auto; padding: 40px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 20px;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <div style="background: linear-gradient(135deg, #6366f1, #4f46e5); width: 60px; height: 60px; border-radius: 12px; display: inline-block; text-align: center; line-height: 60px; color: white; font-weight: bold; font-size: 24px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">F</div>
                    <h1 style="color: #6366f1; margin: 15px 0 5px 0; font-size: 24px;">FundWise Security</h1>
                    <p style="color: #64748b; margin-top: 0;">Verification Identity Check</p>
                </div>
                
                <div style="background: white; padding: 30px; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                    <p style="margin-top: 0;">Hello,</p>
                    <p>To continue with your registration on <strong>FundWise</strong>, please use the 6-digit verification code below. This code is unique to your attempt and will keep your account secure.</p>
                    
                    <div style="text-align: center; margin: 35px 0;">
                        <span style="display: inline-block; padding: 15px 30px; font-size: 36px; font-weight: 800; color: #6366f1; background: #eef2ff; border: 2px solid #6366f1; border-radius: 12px; letter-spacing: 12px; font-family: 'Courier New', Courier, monospace;">
                            ${otp}
                        </span>
                        <p style="font-size: 13px; color: #94a3b8; margin-top: 15px;">Warning: Do not share this code with anyone.</p>
                    </div>
                    
                    <p>This code will expire in <strong style="color: #ef4444;">10 minutes</strong>. If you did not request this, you can safely ignore this email.</p>
                </div>
                
                <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
                    <p style="font-size: 12px; color: #94a3b8;">
                        &copy; 2024 FundWise Platform • Secure Financial Solutions<br/>
                        This is an automated security notification.
                    </p>
                </div>
            </div>
        `
    };

    // 3. Send request to Brevo API
    try {
        const response = await axios.post("https://api.brevo.com/v3/smtp/email", data, {
            headers: {
                "api-key": apiKey,
                "Content-Type": "application/json",
                "Accept": "application/json"
            }
        });

        console.log("Brevo Email Sent:", response.data);
        return { success: true, messageId: response.data.messageId };
    } catch (error) {
        const errorInfo = error.response ? error.response.data : error.message;
        console.error("Brevo API Error:", errorInfo);
        throw new Error("Failed to send verification email via Brevo.");
    }
};

module.exports = { sendOtpEmail };

