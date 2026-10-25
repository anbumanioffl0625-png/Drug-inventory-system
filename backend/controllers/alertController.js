const Drug = require("../models/Drug");
const mailer = require("../utils/mailer");

// GET /api/alerts/status  -> is e-mail switched on?
function getStatus(req, res) {
  res.json(mailer.status());
}

// POST /api/alerts/send  -> e-mail the current low-stock and near-expiry list now
async function sendAlertsNow(req, res, next) {
  try {
    if (!mailer.status().configured) {
      return res.status(400).json({
        message: "Email is not configured on the server. Add the e-mail settings to the .env file (see README).",
      });
    }
    const drugs = await Drug.find();
    const result = await mailer.sendAlertDigest(drugs, "manual");
    if (!result.sent) {
      return res.json({ sent: false, message: "No low-stock or near-expiry drugs right now, so no e-mail was sent." });
    }
    res.json({
      sent: true,
      message: `Alert e-mail sent to ${result.to} recipient(s): ${result.lowStock} low stock, ${result.expiring} near expiry.`,
      ...result,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getStatus, sendAlertsNow };
