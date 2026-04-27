const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
require("dotenv").config();

const app = express();

app.use(cors({
    origin: "http://localhost:5173", // Vite default
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Import Routes
const authRoutes = require("./routes/authRoutes");

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/scholarships", require("./routes/scholarshipRoutes"));
app.use("/api/applications", require("./routes/applicationRoutes"));
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/logs", require("./routes/logRoutes"));
app.use("/api/health", require("./routes/healthRoutes"));

// Test Route
app.get("/", (req, res) => {
    res.send("🚀 FundWise API Running");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});

// Handle unhandled rejections
process.on("unhandledRejection", (err) => {
    console.error("Unhandled Rejection:", err);
});

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
    console.error("Uncaught Exception:", err);
});
