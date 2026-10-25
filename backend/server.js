require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const connectDB = require("./config/db");
const { notFound, errorHandler } = require("./middleware/error");

const authRoutes = require("./routes/authRoutes");
const drugRoutes = require("./routes/drugRoutes");
const orderRoutes = require("./routes/orderRoutes");
const alertRoutes = require("./routes/alertRoutes");
const { startAlertScheduler } = require("./utils/scheduler");

const app = express();

// ---------- Middleware ----------
app.use(cors());
app.use(express.json());

// ---------- API routes ----------
app.get("/api/health", (req, res) => res.json({ status: "ok", time: new Date().toISOString() }));
app.use("/api/auth", authRoutes);
app.use("/api/drugs", drugRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/alerts", alertRoutes);

// ---------- Serve the connected frontend ----------
// Open http://localhost:5000 after starting the server to use the app.
app.use(express.static(path.join(__dirname, "public")));
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api/")) return next();
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ---------- Error handling (must be last) ----------
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`\n  Drug Inventory API running → http://localhost:${PORT}`);
    console.log(`  Health check              → http://localhost:${PORT}/api/health\n`);
    startAlertScheduler();
  });
});
