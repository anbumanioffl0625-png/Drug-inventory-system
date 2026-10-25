const express = require("express");
const { getOrders, createOrder, updateOrderStatus } = require("../controllers/orderController");
const { protect, requireRole } = require("../middleware/auth");

const router = express.Router();

// Anyone signed in can view orders
router.get("/", protect, getOrders);

// Only Distributor & Admin can create new orders
router.post("/", protect, requireRole("Admin", "Distributor"), createOrder);

// Admin & Distributor can advance order status
router.put("/:id/status", protect, requireRole("Admin", "Distributor"), updateOrderStatus);

module.exports = router;
