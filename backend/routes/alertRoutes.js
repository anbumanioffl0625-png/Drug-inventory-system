const express = require("express");
const { getStatus, sendAlertsNow } = require("../controllers/alertController");
const { protect, requireRole } = require("../middleware/auth");

const router = express.Router();

router.get("/status", protect, getStatus);
router.post("/send", protect, requireRole("Admin", "Pharmacist"), sendAlertsNow);

module.exports = router;
