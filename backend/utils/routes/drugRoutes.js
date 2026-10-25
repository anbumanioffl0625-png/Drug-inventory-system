const express = require("express");
const {
  getDrugs,
  getDrugById,
  createDrug,
  updateDrug,
  deleteDrug,
  getAlerts,
} = require("../controllers/drugController");
const { protect, requireRole } = require("../middleware/auth");

const router = express.Router();

// Anyone signed in can view stock
router.get("/", protect, getDrugs);
router.get("/alerts/summary", protect, getAlerts);
router.get("/:id", protect, getDrugById);

// Only Admin & Pharmacist can add/edit/delete stock
router.post("/", protect, requireRole("Admin", "Pharmacist"), createDrug);
router.put("/:id", protect, requireRole("Admin", "Pharmacist"), updateDrug);
router.delete("/:id", protect, requireRole("Admin", "Pharmacist"), deleteDrug);

module.exports = router;
