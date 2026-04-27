const db = require("../config/db");

async function verifyAll() {
    try {
        const [tables] = await db.query("SHOW TABLES");
        for (const tableRow of tables) {
            const tableName = Object.values(tableRow)[0];
            const [count] = await db.query(`SELECT COUNT(*) as count FROM ${tableName}`);
            console.log(`Table ${tableName}: ${count[0].count} rows`);
        }
    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

verifyAll();
