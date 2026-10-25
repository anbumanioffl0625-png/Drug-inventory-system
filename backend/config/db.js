const mongoose = require("mongoose");

async function connectDB() {
  try {
    const uri = process.env.MONGO_URI;
    if (!uri) {
      throw new Error("MONGO_URI is not set. Copy .env.example to .env and fill it in.");
    }
    await mongoose.connect(uri);
    console.log("[db] MongoDB connected:", mongoose.connection.host);
  } catch (err) {
    console.error("[db] MongoDB connection failed:", err.message);
    //process.exit(1);
  }
}

module.exports = connectDB;
