const express = require("express");
const router = express.Router();
const { register, login, logout, refresh, getMe, sendOtp, verifyLogin2FA } = require("../controllers/authController");
const { verifyToken } = require("../middleware/authMiddleware");

router.post("/register", register);
router.post("/login", login);
router.post("/verify-login-2fa", verifyLogin2FA);
router.post("/logout", logout);
router.post("/refresh", refresh);
router.post("/send-otp", sendOtp);
router.get("/me", verifyToken, getMe);

module.exports = router;
