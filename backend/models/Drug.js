const mongoose = require("mongoose");

// NOTE: For simplicity this matches the flat shape the frontend already
// uses (localStorage demo). Drug + Batch + Stock are combined into one
// document here. If you want to split them into separate collections to
// match the ER Diagram exactly, see the comment at the bottom of this file.
const drugSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    manufacturer: { type: String, required: true, trim: true },
    batchNo: { type: String, required: true, trim: true },
    warehouse: { type: String, required: true, trim: true },
    mfgDate: { type: Date, required: true },
    expDate: { type: Date, required: true },
    qty: { type: Number, required: true, min: 0 },
  },
  { timestamps: true }
);

drugSchema.index({ name: "text", category: "text" });

module.exports = mongoose.model("Drug", drugSchema);

/*
  To split into separate Batch / Stock / Warehouse collections
  (matching the ER Diagram 1:N relationships exactly):

  Drug        { name, category, manufacturer }
  Batch       { drugId (ref Drug), batchNo, mfgDate, expDate }
  Warehouse   { name, location }
  Stock       { batchId (ref Batch), warehouseId (ref Warehouse), qty }

  That's a good "Phase 2" refactor once the simpler flat model above
  is working end-to-end.
*/
