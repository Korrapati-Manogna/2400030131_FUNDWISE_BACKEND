const mysql = require("mysql2/promise");
require("dotenv").config();

async function testConnection() {
    try {
        console.log("Attempting to connect to MySQL...");
        console.log("Host:", process.env.DB_HOST);
        console.log("User:", process.env.DB_USER);
        console.log("Database:", process.env.DB_NAME);
        
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || "localhost",
            user: process.env.DB_USER || "root",
            password: process.env.DB_PASS || "0506",
            database: process.env.DB_NAME || "fundwise"
        });
        
        console.log("✅ Successfully connected to MySQL");
        
        const [rows] = await connection.execute("SHOW TABLES");
        console.log("Tables in database:", rows.map(r => Object.values(r)[0]));
        
        await connection.end();
    } catch (err) {
        console.error("❌ Failed to connect to MySQL:");
        console.error(err.message);
        process.exit(1);
    }
}

testConnection();
