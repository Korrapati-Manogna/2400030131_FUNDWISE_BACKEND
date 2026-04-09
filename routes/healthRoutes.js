const express = require("express");
const router = express.Router();
const healthController = require("../controllers/healthController");
const { verifyToken, authorizeRoles } = require("../middleware/authMiddleware");

// Admin only vitality check
router.get("/", verifyToken, authorizeRoles("admin"), healthController.getSystemHealth);

module.exports = router;
