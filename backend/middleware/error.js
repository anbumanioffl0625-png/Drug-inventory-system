// 404 handler — runs when no route matched
function notFound(req, res, next) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}

// Centralized error handler — every controller's try/catch calls next(err)
// and execution lands here, so error formatting only lives in one place.
function errorHandler(err, req, res, next) {
  console.error("[error]", err.message);

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ message: messages.join(", ") });
  }

  // Mongoose duplicate key (e.g. duplicate email on register)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(409).json({ message: `${field} already in use` });
  }

  // Invalid ObjectId in a route param like /api/drugs/:id
  if (err.name === "CastError") {
    return res.status(400).json({ message: `Invalid id: ${err.value}` });
  }

  const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  res.status(statusCode).json({ message: err.message || "Server error" });
}

module.exports = { notFound, errorHandler };
