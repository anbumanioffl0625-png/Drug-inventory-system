// E-mail alerts for low stock and near-expiry drugs.
//
// Two ways to send, chosen automatically from the .env file:
//   1) BREVO_API_KEY set            -> Brevo HTTPS API. Use this on Render's free plan,
//                                       because Render blocks the normal SMTP ports there.
//   2) EMAIL_USER + EMAIL_PASS set  -> Gmail SMTP through Nodemailer (works on your laptop).

const LOW_STOCK_THRESHOLD = 20;
const EXPIRY_WINDOW_DAYS = 30;

function daysUntil(date) {
  const d = new Date(date);
  const now = new Date();
  d.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);
  return Math.round((d - now) / 86400000);
}

// Splits a list of drugs into the two alert lists
function buildSummary(drugs) {
  const lowStock = drugs.filter((d) => d.qty < LOW_STOCK_THRESHOLD);
  const expiring = drugs.filter((d) => daysUntil(d.expDate) <= EXPIRY_WINDOW_DAYS);
  return { lowStock, expiring };
}

function esc(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function day(d) {
  return new Date(d).toISOString().slice(0, 10);
}

function tableHtml(title, rows) {
  if (!rows.length) return "";
  const body = rows
    .map((d) => {
      const left = daysUntil(d.expDate);
      const expiry = left <= 0 ? "Expired" : left + " day(s) left";
      return `<tr><td>${esc(d.name)}</td><td>${esc(d.batchNo)}</td><td>${esc(d.qty)}</td><td>${day(d.expDate)} (${expiry})</td><td>${esc(d.warehouse)}</td></tr>`;
    })
    .join("");
  return (
    `<h3 style="margin:18px 0 6px">${esc(title)}</h3>` +
    `<table cellpadding="6" cellspacing="0" border="1" style="border-collapse:collapse;border-color:#ccc;font-size:13px">` +
    `<tr style="background:#f2f2f2"><th align="left">Drug</th><th align="left">Batch</th><th align="left">Qty</th><th align="left">Expiry</th><th align="left">Warehouse</th></tr>` +
    body +
    `</table>`
  );
}

function renderHtml(summary, intro) {
  return (
    `<div style="font-family:Arial,sans-serif;color:#1b2a2e">` +
    `<h2 style="margin:0 0 6px">Drug Inventory Alert</h2>` +
    `<p style="margin:0 0 10px">${esc(intro)}</p>` +
    tableHtml(`Low stock (below ${LOW_STOCK_THRESHOLD} units)`, summary.lowStock) +
    tableHtml(`Expiring within ${EXPIRY_WINDOW_DAYS} days or already expired`, summary.expiring) +
    `<p style="margin-top:18px;color:#5f7375;font-size:12px">Sent by the Drug Inventory &amp; Supply Chain Tracking App.</p></div>`
  );
}

function mode() {
  if (process.env.BREVO_API_KEY) return "brevo";
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) return "smtp";
  return null;
}
function recipients() {
  const raw = process.env.ALERT_EMAIL_TO || process.env.EMAIL_USER || "";
  return raw.split(",").map((s) => s.trim()).filter(Boolean);
}
function senderEmail() {
  return process.env.EMAIL_FROM || process.env.EMAIL_USER || "";
}

// Used by the Alerts page to show whether e-mail is switched on
function status() {
  const m = mode();
  const ok = !!m && recipients().length > 0 && (m !== "brevo" || !!senderEmail());
  return { configured: ok, mode: ok ? m : null, recipients: ok ? recipients().length : 0 };
}

async function sendMail(subject, html) {
  const st = status();
  if (!st.configured) {
    const err = new Error("Email is not configured. Add EMAIL_USER, EMAIL_PASS and ALERT_EMAIL_TO (or BREVO_API_KEY and EMAIL_FROM) to the .env file.");
    err.code = "EMAIL_NOT_CONFIGURED";
    throw err;
  }
  const to = recipients();

  if (st.mode === "brevo") {
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: { "api-key": process.env.BREVO_API_KEY, "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({
        sender: { name: "Drug Inventory Alerts", email: senderEmail() },
        to: to.map((email) => ({ email })),
        subject,
        htmlContent: html,
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error("Brevo error " + res.status + ": " + text.slice(0, 200));
    }
    return;
  }

  // Gmail SMTP (needs an App Password, not the normal Gmail password)
  const nodemailer = require("nodemailer");
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  });
  await transporter.sendMail({
    from: `"Drug Inventory Alerts" <${process.env.EMAIL_USER}>`,
    to: to.join(","),
    subject,
    html,
  });
}

// Sends one e-mail that lists every low-stock and near-expiry drug
async function sendAlertDigest(drugs, reason) {
  const summary = buildSummary(drugs);
  if (!summary.lowStock.length && !summary.expiring.length) return { sent: false };
  const subject = `Drug Inventory Alert: ${summary.lowStock.length} low stock, ${summary.expiring.length} near expiry`;
  const intro = reason === "scheduled" ? "This is the scheduled stock check." : "This is the alert summary you asked for.";
  await sendMail(subject, renderHtml(summary, intro));
  return { sent: true, lowStock: summary.lowStock.length, expiring: summary.expiring.length, to: recipients().length };
}

// Called right after a drug is saved: e-mails only if that drug itself needs attention
async function notifyDrugSaved(drug) {
  if (!status().configured) return { sent: false };
  const summary = buildSummary([drug]);
  if (!summary.lowStock.length && !summary.expiring.length) return { sent: false };
  const why = [];
  if (summary.lowStock.length) why.push("low stock");
  if (summary.expiring.length) why.push("near expiry");
  await sendMail(`Alert: ${drug.name} (${why.join(", ")})`, renderHtml(summary, `The drug "${drug.name}" was just saved and needs attention.`));
  return { sent: true };
}

module.exports = { buildSummary, renderHtml, status, sendAlertDigest, notifyDrugSaved, LOW_STOCK_THRESHOLD, EXPIRY_WINDOW_DAYS };
