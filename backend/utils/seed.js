// Populates the database with the same sample data used in the
// frontend-only demo, so you can pick up right where that left off.
//
// Run with:  npm run seed

require("dotenv").config();
const connectDB = require("../config/db");
const User = require("../models/User");
const Drug = require("../models/Drug");
const Order = require("../models/Order");

function daysFromNow(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

async function seed() {
  await connectDB();

  await Promise.all([User.deleteMany({}), Drug.deleteMany({}), Order.deleteMany({})]);
  console.log("[seed] cleared existing data");

  await User.create([
    { name: "A. Anbumani", email: "admin@dital.demo", password: "password123", role: "Admin" },
    { name: "Divya (Pharmacist)", email: "pharmacist@dital.demo", password: "password123", role: "Pharmacist" },
    { name: "MedSupply Distributors", email: "distributor@dital.demo", password: "password123", role: "Distributor" },
  ]);
  console.log("[seed] users created (password for all: password123)");

  const drugs = await Drug.create([
    { name: "Paracetamol 500mg", category: "Analgesic", manufacturer: "Cipla", batchNo: "B-2201", mfgDate: daysFromNow(-200), expDate: daysFromNow(20), qty: 15, warehouse: "Chennai Central" },
    { name: "Amoxicillin 250mg", category: "Antibiotic", manufacturer: "Sun Pharma", batchNo: "B-1187", mfgDate: daysFromNow(-90), expDate: daysFromNow(365), qty: 140, warehouse: "Chennai Central" },
    { name: "Cetirizine 10mg", category: "Antihistamine", manufacturer: "Mankind", batchNo: "B-3320", mfgDate: daysFromNow(-60), expDate: daysFromNow(10), qty: 60, warehouse: "Ramapuram Depot" },
    { name: "Insulin Glargine", category: "Hormone", manufacturer: "Biocon", batchNo: "B-9004", mfgDate: daysFromNow(-30), expDate: daysFromNow(180), qty: 12, warehouse: "Cold Storage - RP" },
    { name: "Povidone Iodine", category: "Antiseptic", manufacturer: "Win-Medicare", batchNo: "B-4471", mfgDate: daysFromNow(-400), expDate: daysFromNow(90), qty: 200, warehouse: "Chennai Central" },
    { name: "Metformin 500mg", category: "Antidiabetic", manufacturer: "USV", batchNo: "B-2790", mfgDate: daysFromNow(-120), expDate: daysFromNow(400), qty: 18, warehouse: "Ramapuram Depot" },
    { name: "ORS Sachets", category: "Rehydration", manufacturer: "FDC Ltd", batchNo: "B-5511", mfgDate: daysFromNow(-15), expDate: daysFromNow(500), qty: 300, warehouse: "Chennai Central" },
  ]);
  console.log(`[seed] ${drugs.length} drug records created`);

  await Order.create([
    { drugName: "Amoxicillin 250mg", party: "MedSupply Distributors", qty: 200, status: "Pending", date: daysFromNow(-1) },
    { drugName: "Insulin Glargine", party: "ColdChain Logistics", qty: 50, status: "Shipped", date: daysFromNow(-3) },
    { drugName: "Paracetamol 500mg", party: "Apollo Pharmacy Hub", qty: 500, status: "Delivered", date: daysFromNow(-9) },
  ]);
  console.log("[seed] orders created");

  console.log("\n[seed] Done! Demo logins (password: password123):");
  console.log("  admin@dital.demo        (Admin)");
  console.log("  pharmacist@dital.demo   (Pharmacist)");
  console.log("  distributor@dital.demo  (Distributor)\n");

  process.exit(0);
}

seed().catch((err) => {
  console.error("[seed] failed:", err);
  process.exit(1);
});
