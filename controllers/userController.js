const db = require("../config/db");
const speakeasy = require("speakeasy");
const qrcode = require("qrcode");

// Get current user profile
exports.getProfile = async (req, res) => {
    try {
        const [rows] = await db.query(
            "SELECT id, name, email, role, phone, country, education, field_of_study, gpa, bio, is_two_factor_enabled, created_at FROM users WHERE id = ?",
            [req.user.id]
        );
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        res.status(200).json({ success: true, data: rows[0] });
    } catch (error) {
        console.error("Error fetching profile:", error);
        res.status(500).json({ success: false, message: "Error fetching profile" });
    }
};

// Update current user profile
exports.updateProfile = async (req, res) => {
    const { name, phone, country, education, field_of_study, gpa, bio } = req.body;
    try {
        await db.query(
            "UPDATE users SET name=?, phone=?, country=?, education=?, field_of_study=?, gpa=?, bio=? WHERE id=?",
            [name, phone, country, education, field_of_study, gpa, bio, req.user.id]
        );
        res.status(200).json({ success: true, message: "Profile updated successfully" });
    } catch (error) {
        console.error("Error updating profile:", error);
        res.status(500).json({ success: false, message: "Error updating profile" });
    }
};

// Admin: Get all users
exports.getAllUsers = async (req, res) => {
    try {
        const [rows] = await db.query("SELECT id, name, email, role, created_at FROM users");
        res.status(200).json({ success: true, data: rows });
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ success: false, message: "Error fetching users" });
    }
};

// Admin: Update user role
exports.updateUserRole = async (req, res) => {
    const { id } = req.params;
    const { role } = req.body;
    try {
        await db.query("UPDATE users SET role = ? WHERE id = ?", [role, id]);
        res.status(200).json({ success: true, message: "User role updated" });
    } catch (error) {
        console.error("Error updating user role:", error);
        res.status(500).json({ success: false, message: "Error updating user role" });
    }
};

// Admin: Delete user
exports.deleteUser = async (req, res) => {
    const { id } = req.params;
    try {
        // Prevent admins from deleting themselves via this endpoint (UX safety)
        if (id == req.user.id) {
            return res.status(400).json({ success: false, message: "You cannot delete your own account from here" });
        }

        await db.query("DELETE FROM users WHERE id = ?", [id]);
        
        // Log action
        await db.query(
            "INSERT INTO activity_logs (user_id, action, details) VALUES (?, ?, ?)",
            [req.user.id, "DELETE_USER", `Deleted user ID: ${id}`]
        );

        res.status(200).json({ success: true, message: "User deleted successfully" });
    } catch (error) {
        console.error("Error deleting user:", error);
        res.status(500).json({ success: false, message: "Error deleting user" });
    }
};

// --- Two-Factor Authentication (2FA) ---

// Setup 2FA: Generate secret and QR code
exports.setup2FA = async (req, res) => {
    try {
        const secret = speakeasy.generateSecret({
            name: `FundWise:${req.user.email}`
        });

        const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url);

        // Store secret temporarily (disabled until verified)
        await db.query(
            "UPDATE users SET two_factor_secret = ?, is_two_factor_enabled = FALSE WHERE id = ?",
            [secret.base32, req.user.id]
        );

        res.status(200).json({
            success: true,
            secret: secret.base32,
            qrCode: qrCodeUrl
        });
    } catch (error) {
        console.error("2FA Setup Error:", error);
        res.status(500).json({ success: false, message: "Failed to setup 2FA" });
    }
};

// Verify and Enable 2FA
exports.verify2FA = async (req, res) => {
    const { token } = req.body;
    try {
        const [rows] = await db.query("SELECT two_factor_secret FROM users WHERE id = ?", [req.user.id]);
        if (rows.length === 0 || !rows[0].two_factor_secret) {
            return res.status(400).json({ success: false, message: "2FA not initiated" });
        }

        const verified = speakeasy.totp.verify({
            secret: rows[0].two_factor_secret,
            encoding: "base32",
            token: token
        });

        if (verified) {
            await db.query("UPDATE users SET is_two_factor_enabled = TRUE WHERE id = ?", [req.user.id]);
            return res.status(200).json({ success: true, message: "2FA enabled successfully" });
        } else {
            return res.status(400).json({ success: false, message: "Invalid OTP token" });
        }
    } catch (error) {
        console.error("2FA Verification Error:", error);
        res.status(500).json({ success: false, message: "Failed to verify 2FA" });
    }
};

// Disable 2FA
exports.disable2FA = async (req, res) => {
    try {
        await db.query(
            "UPDATE users SET two_factor_secret = NULL, is_two_factor_enabled = FALSE WHERE id = ?",
            [req.user.id]
        );
        res.status(200).json({ success: true, message: "2FA disabled successfully" });
    } catch (error) {
        console.error("2FA Disable Error:", error);
        res.status(500).json({ success: false, message: "Failed to disable 2FA" });
    }
};
