const express = require("express");
const router = express.Router();
const logController = require("../controllers/logController");
const { verifyToken, authorizeRoles } = require("../middleware/authMiddleware");

// All log routes are admin-only
router.get("/", verifyToken, authorizeRoles("admin"), logController.getAllLogs);
// router.get("/", logController.getAllLogs);
router.delete("/", verifyToken, authorizeRoles("admin"), logController.clearLogs);
router.delete("/:id", verifyToken, authorizeRoles("admin"), logController.deleteLog);

module.exports = router;
