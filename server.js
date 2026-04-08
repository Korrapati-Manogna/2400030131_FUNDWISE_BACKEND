const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

//  MySQL Connection
const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "0506",
    database: "fundwise"
});

db.connect(err => {
    if (err) {
        console.log("❌ Database connection failed", err);
    } else {
        console.log("✅ Connected to MySQL");
    }
});

//  DEBUG: Check which DB is connected
db.query("SELECT DATABASE() AS db", (err, result) => {
    if (err) {
        console.log("Error checking DB");
    } else {
        console.log("✅ Connected to DB:", result[0].db);
    }
});

// Test Route
app.get("/", (req, res) => {
    res.send("🚀 Backend Running");
});


// ================= USERS =================

// Register
app.post("/register", (req, res) => {
    const { name, email, password, role } = req.body;

    const checkSql = "SELECT * FROM users WHERE email = ?";

    db.query(checkSql, [email], (err, result) => {
        if (err) {
            console.log(err);
            return res.json({ success: false });
        }

        if (result.length > 0) {
            return res.json({
                success: false,
                message: "User already exists"
            });
        }

        const insertSql = "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)";

        db.query(insertSql, [name, email, password, role], (err) => {
            if (err) {
                console.log(err);
                return res.json({ success: false });
            }

            res.json({
                success: true,
                user: { name, email, role }
            });
        });
    });
});


// Login
app.post("/login", (req, res) => {
    console.log("🔐 Login API hit");

    const { email, password } = req.body;

    const sql = "SELECT * FROM users WHERE email = ? AND password = ?";

    db.query(sql, [email, password], (err, result) => {
        console.log("DB Result:", result);

        if (err) {
            console.log(err);
            return res.json({ success: false });
        }

        if (result.length > 0) {
            res.json({
                success: true,
                user: {
                    name: result[0].name,
                    email: result[0].email,
                    role: result[0].role
                }
            });
        } else {
            res.json({
                success: false,
                message: "Invalid email or password"
            });
        }
    });
});


// ================= STUDENTS =================

// Add student
app.post("/addStudent", (req, res) => {
    const { name, email, scholarship } = req.body;

    const sql = "INSERT INTO students (name, email, scholarship) VALUES (?, ?, ?)";

    db.query(sql, [name, email, scholarship], (err) => {
        if (err) {
            console.log(err);
            return res.send("Error adding student");
        }
        res.send("✅ Student Added");
    });
});

//  Get students
app.get("/students", (req, res) => {
    db.query("SELECT * FROM students", (err, result) => {
        if (err) {
            console.log(err);
            return res.send(err);
        }
        res.json(result);
    });
});


// ================= APPLICATIONS =================

//  Apply
app.post("/apply", (req, res) => {
    const { name, email, scholarship } = req.body;

    const sql = "INSERT INTO applications (name, email, scholarship) VALUES (?, ?, ?)";

    db.query(sql, [name, email, scholarship], (err) => {
        if (err) {
            console.log(err);
            return res.json({ success: false });
        }

        res.json({ success: true });
    });
});

// Aprove
app.post("/approve", (req, res) => {
    const { id } = req.body;

    db.query(
        "UPDATE applications SET status = 'approved' WHERE id = ?",
        [id],
        (err) => {
            if (err) {
                console.log(err);
                return res.json({ success: false });
            }
            res.json({ success: true });
        }
    );
});

// Reject
app.post("/reject", (req, res) => {
    const { id } = req.body;

    db.query(
        "UPDATE applications SET status = 'rejected' WHERE id = ?",
        [id],
        (err) => {
            if (err) {
                console.log(err);
                return res.json({ success: false });
            }
            res.json({ success: true });
        }
    );
});


// ================= DEBUG ROUTES =================


app.get("/checkUsers", (req, res) => {
    db.query("SELECT * FROM users", (err, result) => {
        if (err) return res.send(err);
        res.json(result);
    });
});


app.get("/checkAll", (req, res) => {
    const data = {};

    db.query("SELECT * FROM users", (err, users) => {
        if (err) return res.send(err);
        data.users = users;

        db.query("SELECT * FROM students", (err, students) => {
            if (err) return res.send(err);
            data.students = students;

            db.query("SELECT * FROM applications", (err, applications) => {
                if (err) return res.send(err);
                data.applications = applications;

                res.json(data);
            });
        });
    });
});


app.listen(5000, () => {
    console.log("🚀 Server running on port 5000");
});