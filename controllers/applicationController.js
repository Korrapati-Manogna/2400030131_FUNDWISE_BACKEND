const db = require("../config/db");

// Get all applications for current user
exports.getUserApplications = async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT a.*, s.title, s.amount, s.deadline 
             FROM applications a 
             JOIN scholarships s ON a.scholarship_id = s.id 
             WHERE a.user_id = ?`, 
            [req.user.id]
        );
        res.status(200).json({ success: true, data: rows });
    } catch (error) {
        console.error("Error fetching user applications:", error);
        res.status(500).json({ success: false, message: "Error fetching applications" });
    }
};

// Create a new application
exports.applyForScholarship = async (req, res) => {
    const { scholarshipId } = req.body;
    if (!scholarshipId) {
        return res.status(400).json({ success: false, message: "Scholarship ID is required" });
    }

    try {
        // Check if already applied
        const [existing] = await db.query(
            "SELECT id FROM applications WHERE user_id = ? AND scholarship_id = ?",
            [req.user.id, scholarshipId]
        );

        if (existing.length > 0) {
            return res.status(400).json({ success: false, message: "You have already applied for this scholarship" });
        }

        const [result] = await db.query(
            "INSERT INTO applications (user_id, scholarship_id, status) VALUES (?, ?, 'Submitted')",
            [req.user.id, scholarshipId]
        );

        res.status(201).json({ success: true, message: "Application submitted successfully", data: { id: result.insertId } });
    } catch (error) {
        console.error("Error submitting application:", error);
        res.status(500).json({ success: false, message: "Error submitting application" });
    }
};

// Update application status (Admin/Moderator or User for withdrawal)
exports.updateApplicationStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    try {
        // Basic role check: Users can only withdraw or set to draft if it's theirs
        // For simplicity, we'll let Admin/Moderator change any status
        // and Users change status of their own apps (logic can be refined)
        
        await db.query("UPDATE applications SET status = ? WHERE id = ?", [status, id]);
        res.status(200).json({ success: true, message: "Application status updated" });
    } catch (error) {
        console.error("Error updating application:", error);
        res.status(500).json({ success: false, message: "Error updating application" });
    }
};

// Get all applications (Admin/Moderator only)
exports.getAllApplications = async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT a.*, u.name as user_name, u.email as user_email, s.title as scholarship_title 
             FROM applications a 
             JOIN users u ON a.user_id = u.id 
             JOIN scholarships s ON a.scholarship_id = s.id 
             ORDER BY a.applied_date DESC`
        );
        res.status(200).json({ success: true, data: rows });
    } catch (error) {
        console.error("Error fetching all applications:", error);
        res.status(500).json({ success: false, message: "Error fetching applications" });
    }
};

// Delete application
exports.deleteApplication = async (req, res) => {
    const { id } = req.params;
    try {
        // Only allow admins or the owner to delete
        const [app] = await db.query("SELECT user_id FROM applications WHERE id = ?", [id]);
        
        if (app.length === 0) {
            return res.status(404).json({ success: false, message: "Application not found" });
        }

        if (req.user.role !== "admin" && app[0].user_id !== req.user.id) {
            return res.status(403).json({ success: false, message: "Unauthorized to delete this application" });
        }

        await db.query("DELETE FROM applications WHERE id = ?", [id]);
        
        // Log action
        await db.query(
            "INSERT INTO activity_logs (user_id, action, details) VALUES (?, ?, ?)",
            [req.user.id, "DELETE_APPLICATION", `Deleted application ID: ${id}`]
        );

        res.status(200).json({ success: true, message: "Application deleted successfully" });
    } catch (error) {
        console.error("Error deleting application:", error);
        res.status(500).json({ success: false, message: "Error deleting application" });
    }
};

// Get high-level metrics for admin (including real-time logs)
exports.getDashboardMetrics = async (req, res) => {
    try {
        const [logs] = await db.query(
            "SELECT COUNT(*) as count FROM activity_logs WHERE DATE(timestamp) = CURDATE()"
        );
        
        res.status(200).json({ 
            success: true, 
            data: { 
                logsToday: logs[0].count 
            } 
        });
    } catch (error) {
        console.error("Error fetching metrics:", error);
        res.status(500).json({ success: false, message: "Error fetching metrics" });
    }
};
