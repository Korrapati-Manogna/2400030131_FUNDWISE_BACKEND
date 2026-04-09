const db = require("../config/db");
const os = require("os");

exports.getSystemHealth = async (req, res) => {
    try {
        // Check DB connection
        const [rows] = await db.execute("SELECT 1");
        
        // Get system metrics
        const health = {
            status: "Healthy",
            database: "Connected",
            uptime: Math.floor(process.uptime()),
            timestamp: new Date().toISOString(),
            load: os.loadavg()[0].toFixed(2),
            memory: {
                total: (os.totalmem() / (1024 * 1024 * 1024)).toFixed(2) + " GB",
                free: (os.freemem() / (1024 * 1024 * 1024)).toFixed(2) + " GB"
            }
        };

        res.json({ success: true, health });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            health: { status: "Degraded", database: "Disconnected" },
            error: error.message 
        });
    }
};
