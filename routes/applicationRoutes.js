const express = require("express");
const router = express.Router();
const applicationController = require("../controllers/applicationController");
const { verifyToken, authorizeRoles } = require("../middleware/authMiddleware");

// User routes
router.get("/my", verifyToken, applicationController.getUserApplications);
router.post("/apply", verifyToken, applicationController.applyForScholarship);

// Admin/Moderator routes
router.get("/", verifyToken, authorizeRoles("admin", "moderator"), applicationController.getAllApplications);
router.get("/metrics/admin", verifyToken, authorizeRoles("admin"), applicationController.getDashboardMetrics);
router.put("/:id/status", verifyToken, authorizeRoles("admin", "moderator"), applicationController.updateApplicationStatus);
router.delete("/:id", verifyToken, applicationController.deleteApplication);

module.exports = router;
