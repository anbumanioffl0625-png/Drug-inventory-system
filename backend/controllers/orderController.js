const Order = require("../models/Order");

// GET /api/orders?status=Pending
async function getOrders(req, res, next) {
  try {
    const { status } = req.query;
    const query = status ? { status } : {};
    const orders = await Order.find(query).sort({ date: -1 });
    res.json(orders);
  } catch (err) {
    next(err);
  }
}

// POST /api/orders
async function createOrder(req, res, next) {
  try {
    const order = await Order.create(req.body);
    res.status(201).json(order);
  } catch (err) {
    next(err);
  }
}

// PUT /api/orders/:id/status   body: { status: "Shipped" }
async function updateOrderStatus(req, res, next) {
  try {
    const { status } = req.body;
    if (!["Pending", "Shipped", "Delivered"].includes(status)) {
      return res.status(400).json({ message: "status must be Pending, Shipped or Delivered" });
    }
    const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!order) return res.status(404).json({ message: "Order not found" });
    res.json(order);
  } catch (err) {
    next(err);
  }
}

module.exports = { getOrders, createOrder, updateOrderStatus };
