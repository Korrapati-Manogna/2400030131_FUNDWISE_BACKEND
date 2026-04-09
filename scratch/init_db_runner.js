const mysql = require("mysql2/promise");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

async function initDb() {
    let connection;
    try {
        console.log("Initializing database schema...");
        
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || "localhost",
            user: process.env.DB_USER || "root",
            password: process.env.DB_PASS || "0506",
            multipleStatements: true
        });

        const sqlPath = path.join(__dirname, "..", "init_db.sql");
        const sql = fs.readFileSync(sqlPath, "utf8");

        await connection.query(sql);
        console.log("✅ Database and tables initialized successfully.");
        
        const [rows] = await connection.execute("SHOW TABLES FROM fundwise");
        console.log("Current tables in fundwise:", rows.map(r => Object.values(r)[0]));

    } catch (err) {
        console.error("❌ Failed to initialize database:");
        console.error(err.message);
    } finally {
        if (connection) await connection.end();
    }
}

initDb();
