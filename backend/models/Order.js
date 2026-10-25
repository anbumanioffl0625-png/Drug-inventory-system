const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    drugName: { type: String, required: true, trim: true },
    party: { type: String, required: true, trim: true }, // supplier / distributor / buyer name
    qty: { type: Number, required: true, min: 1 },
    status: {
      type: String,
      enum: ["Pending", "Shipped", "Delivered"],
      default: "Pending",
    },
    date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
