const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { verifyToken, authorizeRoles } = require("../middleware/authMiddleware");

// Profile routes
router.get("/profile", verifyToken, userController.getProfile);
router.put("/profile", verifyToken, userController.updateProfile);

// Admin routes
router.get("/", verifyToken, authorizeRoles("admin"), userController.getAllUsers);
router.post("/", verifyToken, authorizeRoles("admin"), userController.createUser);
router.put("/:id/role", verifyToken, authorizeRoles("admin"), userController.updateUserRole);
router.delete("/:id", verifyToken, authorizeRoles("admin"), userController.deleteUser);

// 2FA routes
router.post("/2fa/setup", verifyToken, userController.setup2FA);
router.post("/2fa/verify", verifyToken, userController.verify2FA);
router.post("/2fa/disable", verifyToken, userController.disable2FA);

module.exports = router;
