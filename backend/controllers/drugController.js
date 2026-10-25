const Drug = require("../models/Drug");
const mailer = require("../utils/mailer");

const LOW_STOCK_THRESHOLD = 20;
const EXPIRY_WINDOW_DAYS = 30;

// GET /api/drugs?search=&filter=low|expiring
async function getDrugs(req, res, next) {
  try {
    const { search, filter } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } },
        { batchNo: { $regex: search, $options: "i" } },
      ];
    }
    if (filter === "low") {
      query.qty = { $lt: LOW_STOCK_THRESHOLD };
    }
    if (filter === "expiring") {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() + EXPIRY_WINDOW_DAYS);
      query.expDate = { $lte: cutoff };
    }

    const drugs = await Drug.find(query).sort({ createdAt: -1 });
    res.json(drugs);
  } catch (err) {
    next(err);
  }
}

// GET /api/drugs/:id
async function getDrugById(req, res, next) {
  try {
    const drug = await Drug.findById(req.params.id);
    if (!drug) return res.status(404).json({ message: "Drug record not found" });
    res.json(drug);
  } catch (err) {
    next(err);
  }
}

// POST /api/drugs
async function createDrug(req, res, next) {
  try {
    const drug = await Drug.create(req.body);
    // e-mail only if this drug is already low or near expiry (never blocks the response)
    mailer.notifyDrugSaved(drug).catch((err) => console.error("[mail]", err.message));
    res.status(201).json(drug);
  } catch (err) {
    next(err);
  }
}

// PUT /api/drugs/:id
async function updateDrug(req, res, next) {
  try {
    const drug = await Drug.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!drug) return res.status(404).json({ message: "Drug record not found" });
    mailer.notifyDrugSaved(drug).catch((err) => console.error("[mail]", err.message));
    res.json(drug);
  } catch (err) {
    next(err);
  }
}

// DELETE /api/drugs/:id
async function deleteDrug(req, res, next) {
  try {
    const drug = await Drug.findByIdAndDelete(req.params.id);
    if (!drug) return res.status(404).json({ message: "Drug record not found" });
    res.json({ message: "Deleted", id: req.params.id });
  } catch (err) {
    next(err);
  }
}

// GET /api/drugs/alerts/summary — low-stock & near-expiry, computed server-side
async function getAlerts(req, res, next) {
  try {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() + EXPIRY_WINDOW_DAYS);

    const [lowStock, nearExpiry] = await Promise.all([
      Drug.find({ qty: { $lt: LOW_STOCK_THRESHOLD } }),
      Drug.find({ expDate: { $lte: cutoff } }),
    ]);

    res.json({ lowStock, nearExpiry });
  } catch (err) {
    next(err);
  }
}

module.exports = { getDrugs, getDrugById, createDrug, updateDrug, deleteDrug, getAlerts };
