const express = require("express");
const router = express.Router();
const scholarshipController = require("../controllers/scholarshipController");
const { verifyToken, authorizeRoles } = require("../middleware/authMiddleware");

// Public/User routes
router.get("/", verifyToken, scholarshipController.getAllScholarships);

// Admin only routes
router.post("/", verifyToken, authorizeRoles("admin"), scholarshipController.createScholarship);
router.put("/:id", verifyToken, authorizeRoles("admin"), scholarshipController.updateScholarship);
router.delete("/:id", verifyToken, authorizeRoles("admin"), scholarshipController.deleteScholarship);

module.exports = router;
