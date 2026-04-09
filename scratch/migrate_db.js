const mysql = require("mysql2/promise");
require("dotenv").config();

async function migrate() {
    let connection;
    try {
        console.log("Starting safe database migration...");
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || "localhost",
            user: process.env.DB_USER || "root",
            password: process.env.DB_PASS || "0506",
            database: process.env.DB_NAME || "fundwise",
            multipleStatements: true
        });

        // 1. Alter users table to add missing columns
        console.log("Updating 'users' table structure...");
        const alterUsersSql = `
            ALTER TABLE users 
            MODIFY COLUMN id BIGINT AUTO_INCREMENT,
            MODIFY COLUMN email VARCHAR(255) UNIQUE NOT NULL,
            MODIFY COLUMN name VARCHAR(255) NOT NULL,
            MODIFY COLUMN password VARCHAR(255) NOT NULL,
            ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
            ADD COLUMN IF NOT EXISTS country VARCHAR(100),
            ADD COLUMN IF NOT EXISTS education VARCHAR(100),
            ADD COLUMN IF NOT EXISTS field_of_study VARCHAR(100),
            ADD COLUMN IF NOT EXISTS gpa VARCHAR(10),
            ADD COLUMN IF NOT EXISTS bio TEXT,
            ADD COLUMN IF NOT EXISTS last_login TIMESTAMP,
            ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
        `;
        // Execute line by line because ADD COLUMN IF NOT EXISTS is not standard in all MySQL versions
        // We'll use a more robust approach in a loop if needed, but let's try the basic alter first
        // and catch "Duplicate column" errors if they occur
        try {
             await connection.query("ALTER TABLE users MODIFY COLUMN email VARCHAR(255) UNIQUE NOT NULL");
             await connection.query("ALTER TABLE users MODIFY COLUMN name VARCHAR(255) NOT NULL");
             await connection.query("ALTER TABLE users MODIFY COLUMN password VARCHAR(255) NOT NULL");
             await connection.query("ALTER TABLE users MODIFY COLUMN role VARCHAR(50) DEFAULT 'user'");
        } catch (e) { console.log("Some constraints might already exist."); }

        const columnsToAdd = [
            ["phone", "VARCHAR(20)"],
            ["country", "VARCHAR(100)"],
            ["education", "VARCHAR(100)"],
            ["field_of_study", "VARCHAR(100)"],
            ["gpa", "VARCHAR(10)"],
            ["bio", "TEXT"],
            ["last_login", "TIMESTAMP"],
            ["created_at", "TIMESTAMP DEFAULT CURRENT_TIMESTAMP"],
            ["two_factor_secret", "VARCHAR(255)"],
            ["is_two_factor_enabled", "BOOLEAN DEFAULT FALSE"]
        ];

        for (const [col, type] of columnsToAdd) {
            try {
                await connection.query(`ALTER TABLE users ADD COLUMN ${col} ${type}`);
                console.log(`Added column ${col}`);
            } catch (err) {
                if (err.code === 'ER_DUP_FIELDNAME') {
                    console.log(`Column ${col} already exists.`);
                } else {
                    console.error(`Error adding ${col}:`, err.message);
                }
            }
        }

        // 2. Create other tables with BIGINT for user_id to match existing bigint IDs
        console.log("Creating dependent tables...");
        const createTablesSql = `
            CREATE TABLE IF NOT EXISTS scholarships (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                amount VARCHAR(50) NOT NULL,
                deadline DATE NOT NULL,
                category VARCHAR(100),
                eligibility TEXT,
                description TEXT,
                match_percentage INT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS applications (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id BIGINT NOT NULL,
                scholarship_id INT NOT NULL,
                status ENUM('Draft', 'Submitted', 'In Review', 'Approved', 'Rejected') DEFAULT 'Draft',
                applied_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (scholarship_id) REFERENCES scholarships(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS notifications (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id BIGINT NOT NULL,
                message TEXT NOT NULL,
                type ENUM('info', 'success', 'warning', 'error') DEFAULT 'info',
                is_read BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS activity_logs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id BIGINT,
                action VARCHAR(255) NOT NULL,
                details TEXT,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
            );
        `;
        await connection.query(createTablesSql);

        // 3. Seed scholarships if empty
        const [scholarships] = await connection.execute("SELECT id FROM scholarships LIMIT 1");
        if (scholarships.length === 0) {
            console.log("Seeding initial scholarships...");
            await connection.query(`
                INSERT INTO scholarships (title, amount, deadline, category, match_percentage) VALUES 
                ('Global Excellence Scholarship', '$10,000', '2026-06-15', 'Academic', 95),
                ('STEM Innovation Grant', '$5,000', '2026-05-20', 'Science/Tech', 88),
                ('First-Gen Pioneer Fund', '$2,500', '2026-04-30', 'General', 92),
                ('Women in Tech Scholarship', '$7,500', '2026-08-01', 'Diversity', 85);
            `);
        }

        console.log("✅ Migration completed successfully.");
    } catch (err) {
        console.error("❌ Migration failed:");
        console.error(err);
    } finally {
        if (connection) await connection.end();
    }
}

migrate();
