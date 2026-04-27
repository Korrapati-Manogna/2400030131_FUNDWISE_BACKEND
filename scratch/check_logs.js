const db = require("../config/db");

async function checkLogs() {
    try {
        console.log("Checking logs...");
        const [rows] = await db.query("SELECT * FROM activity_logs LIMIT 5");
        console.log("Logs in database:", rows.length);
        
        console.log("Generating comprehensive test logs...");
        await db.query(
            "INSERT INTO activity_logs (action, details) VALUES (?, ?), (?, ?), (?, ?), (?, ?)",
            [
                "SYSTEM_STARTUP", "Core system services started", 
                "USER_LOGIN_SUCCESS", "Admin user logged in from 127.0.0.1",
                "SCHOLARSHIP_CREATED", "New scholarship 'STEM Excellence' added",
                "DATABASE_BACKUP", "Scheduled database backup completed"
            ]
        );
        console.log("✅ Comprehensive test logs generated.");
    } catch (error) {
        console.error("Database error:", error);
    } finally {
        process.exit();
    }
}

checkLogs();
