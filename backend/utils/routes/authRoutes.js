const express = require("express");
const { register, login, me, listUsers } = require("../controllers/authController");
const { protect, requireRole } = require("../middleware/auth");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", protect, me);
router.get("/users", protect, requireRole("Admin"), listUsers);

module.exports = router;
