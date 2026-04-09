const db = require("../config/db");

exports.getNotifications = async (req, res) => {
    try {
        const [rows] = await db.execute(
            "SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC",
            [req.user.id]
        );
        res.status(200).json({ success: true, data: rows });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.markAsRead = async (req, res) => {
    try {
        await db.execute(
            "UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?",
            [req.params.id, req.user.id]
        );
        res.status(200).json({ success: true, message: "Notification marked as read" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.createNotification = async (userId, message, type = "info") => {
    try {
        await db.execute(
            "INSERT INTO notifications (user_id, message, type) VALUES (?, ?, ?)",
            [userId, message, type]
        );
    } catch (err) {
        console.error("Failed to create notification:", err);
    }
};
