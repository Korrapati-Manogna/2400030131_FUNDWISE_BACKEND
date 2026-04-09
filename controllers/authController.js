const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const speakeasy = require("speakeasy");
const db = require("../config/db");
const { generateAccessToken, generateRefreshToken, sendRefreshToken } = require("../utils/tokenUtils");
const { sendOtpEmail } = require("../utils/emailService");

// @desc    Register a new user (with OTP verification)
// @route   POST /api/auth/register
exports.register = async (req, res) => {
    const { name, email, password, otp, role = "user" } = req.body;

    try {
        // 1. Verify OTP
        const [otpRecords] = await db.query(
            "SELECT * FROM otp_verifications WHERE email = ? AND otp_code = ? AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1",
            [email, otp]
        );

        if (otpRecords.length === 0) {
            return res.status(400).json({ success: false, message: "Invalid or expired OTP code" });
        }

        // 2. Clear OTP records for this email
        await db.query("DELETE FROM otp_verifications WHERE email = ?", [email]);

        // 3. Normal registration flow
        const [existing] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
        if (existing.length > 0) {
            return res.status(400).json({ success: false, message: "User already exists" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const [result] = await db.query(
            "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
            [name, email, hashedPassword, role]
        );

        const user = { id: result.insertId, name, email, role };
        
        // --- AUTO LOGIN LOGIC ---
        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);
        sendRefreshToken(res, refreshToken);
        // -------------------------

        res.status(201).json({
            success: true,
            message: "User registered successfully",
            data: { user, accessToken }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Send OTP to email
// @route   POST /api/auth/send-otp
exports.sendOtp = async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ success: false, message: "Email is required" });
    }

    try {
        // Generate a 6-digit OTP
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

        // Store OTP in database
        await db.query(
            "INSERT INTO otp_verifications (email, otp_code, expires_at) VALUES (?, ?, ?)",
            [email, otpCode, expiresAt]
        );

        // Send Email
        await sendOtpEmail(email, otpCode);

        res.json({ success: true, message: "Verification code sent to email" });
    } catch (error) {
        console.error("OTP Error:", error);
        res.status(500).json({ success: false, message: "Failed to send verification code" });
    }
};

// @desc    Login user
// @route   POST /api/auth/login
exports.login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const [users] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
        const user = users[0];

        if (!user) {
            return res.status(401).json({ success: false, message: "Invalid email or password" });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ success: false, message: "Invalid email or password" });
        }

        if (user.is_two_factor_enabled) {
            return res.json({
                success: true,
                require2FA: true,
                message: "Two-Factor Authentication required",
                email: user.email
            });
        }

        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);

        sendRefreshToken(res, refreshToken);

        res.json({
            success: true,
            data: {
                user: { id: user.id, name: user.name, email: user.email, role: user.role },
                accessToken
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Verify 2FA token during login
// @route   POST /api/auth/verify-login-2fa
exports.verifyLogin2FA = async (req, res) => {
    const { email, token } = req.body;
    try {
        const [users] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
        const user = users[0];

        if (!user || !user.is_two_factor_enabled || !user.two_factor_secret) {
            return res.status(400).json({ success: false, message: "2FA not properly configured for this user" });
        }

        const verified = speakeasy.totp.verify({
            secret: user.two_factor_secret,
            encoding: "base32",
            token: token
        });

        if (!verified) {
            return res.status(401).json({ success: false, message: "Invalid authenticator code." });
        }

        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);

        sendRefreshToken(res, refreshToken);

        res.json({
            success: true,
            data: {
                user: { id: user.id, name: user.name, email: user.email, role: user.role },
                accessToken
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Logout user / Clear cookie
// @route   POST /api/auth/logout
exports.logout = async (req, res) => {
    res.clearCookie("refreshToken", { 
        httpOnly: true, 
        sameSite: "lax", 
        secure: process.env.NODE_ENV === "production" 
    });
    res.json({ success: true, message: "Logged out successfully" });
};

// @desc    Refresh token
// @route   POST /api/auth/refresh
exports.refresh = async (req, res) => {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
        return res.status(401).json({ success: false, message: "No refresh token provided" });
    }

    try {
        const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
        
        const [users] = await db.query("SELECT * FROM users WHERE id = ?", [decoded.id]);
        const user = users[0];

        if (!user) {
            return res.status(401).json({ success: false, message: "User not found" });
        }

        const accessToken = generateAccessToken(user);
        res.json({ success: true, data: { accessToken } });
    } catch (error) {
        res.status(403).json({ success: false, message: "Invalid or expired refresh token" });
    }
};

// @desc    Get current user profile (session rehydration)
// @route   GET /api/auth/me
exports.getMe = async (req, res) => {
    try {
        const [users] = await db.query("SELECT id, name, email, role FROM users WHERE id = ?", [req.user.id]);
        res.json({ success: true, data: users[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
