// Checks stock every ALERT_INTERVAL_HOURS (default 24) and e-mails the alert list.
// Note: on a free host that goes to sleep, the timer only runs while the app is awake.
const Drug = require("../models/Drug");
const mailer = require("./mailer");

function startAlertScheduler() {
  const hours = Number(process.env.ALERT_INTERVAL_HOURS ?? 24);
  if (!hours || hours <= 0) {
    console.log("[mail] Scheduled e-mail check is off (ALERT_INTERVAL_HOURS is 0).");
    return;
  }
  if (!mailer.status().configured) {
    console.log("[mail] E-mail alerts are off (not configured in .env).");
    return;
  }
  const run = async () => {
    try {
      const drugs = await Drug.find();
      const result = await mailer.sendAlertDigest(drugs, "scheduled");
      console.log("[mail] scheduled check:", result.sent ? "e-mail sent" : "nothing to report");
    } catch (err) {
      console.error("[mail] scheduled check failed:", err.message);
    }
  };
  setInterval(run, hours * 3600 * 1000);
  console.log(`[mail] E-mail alerts are on. Checking every ${hours} hour(s).`);
}

module.exports = { startAlertScheduler };
