const db = require("../config/db");

// Get all activity logs (Admin only)
exports.getAllLogs = async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT al.*, u.name as user_name, u.email as user_email 
             FROM activity_logs al 
             LEFT JOIN users u ON al.user_id = u.id 
             ORDER BY al.timestamp DESC 
             LIMIT 500`
        );
        
        // Map backend logs to the format expected by the frontend UI
        const mappedLogs = rows.map(log => ({
            id: log.id,
            action: log.action,
            user: log.user_name || "System",
            email: log.user_email || "system@fundwise.com",
            metadata: log.details,
            type: determineLogType(log.action),
            timestamp: log.timestamp
        }));

        res.status(200).json({ success: true, data: mappedLogs });
    } catch (error) {
        console.error("Error fetching logs:", error);
        res.status(500).json({ success: false, message: "Error fetching logs" });
    }
};

// Clear all logs (Admin only)
exports.clearLogs = async (req, res) => {
    try {
        await db.query("DELETE FROM activity_logs");
        res.status(200).json({ success: true, message: "All logs cleared" });
    } catch (error) {
        console.error("Error clearing logs:", error);
        res.status(500).json({ success: false, message: "Error clearing logs" });
    }
};

// Delete a specific log (Admin only)
exports.deleteLog = async (req, res) => {
    const { id } = req.params;
    try {
        await db.query("DELETE FROM activity_logs WHERE id = ?", [id]);
        res.status(200).json({ success: true, message: "Log deleted" });
    } catch (error) {
        console.error("Error deleting log:", error);
        res.status(500).json({ success: false, message: "Error deleting log" });
    }
};

// Helper function to map action to log type (info, success, warning, error)
function determineLogType(action) {
    if (action.includes("DELETE") || action.includes("DISABLE") || action.includes("REMOVE")) return "warning";
    if (action.includes("CREATE") || action.includes("APPLY") || action.includes("SUCCESS") || action.includes("ENABLE")) return "success";
    if (action.includes("ERROR") || action.includes("FAIL")) return "error";
    return "info";
}
