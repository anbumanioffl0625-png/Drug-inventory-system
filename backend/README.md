# Drug Inventory & Supply Chain Tracking — Backend

Real Node.js + Express + MongoDB backend for the Drug Inventory & Supply
Chain Tracking App, matching the API design in the Review 1 & 2 PPT.
It also serves the connected frontend (`public/index.html`), so once
this server is running, the whole app works end-to-end on your laptop.

## What's inside

```
backend/
├── server.js              Express app entry point
├── config/db.js           MongoDB connection
├── models/                Mongoose schemas: User, Drug, Order
├── controllers/            Route logic (auth, drugs, orders)
├── routes/                 /api/auth, /api/drugs, /api/orders
├── middleware/auth.js      JWT verification + role checks
├── middleware/error.js     Centralized error handling
├── utils/seed.js           Populates the DB with demo data
└── public/index.html       The frontend (calls the API instead of localStorage)
```

## 1. Install prerequisites

You said you already have **VS Code** and **Node.js** — good, that's all you need
besides MongoDB. Two ways to get MongoDB, pick one:

**Option A — MongoDB Atlas (free, no install, recommended)**
1. Go to https://www.mongodb.com/cloud/atlas/register and create a free account
2. Create a free (M0) cluster
3. Under *Database Access*, create a user with a password
4. Under *Network Access*, add your IP (or `0.0.0.0/0` for testing)
5. Click *Connect → Drivers*, copy the connection string
   (looks like `mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/`)

**Option B — Local MongoDB**
Install MongoDB Community Server for your OS from
https://www.mongodb.com/try/download/community, then start it
(it normally runs automatically as a service after install).

## 2. Configure environment variables

In the `backend/` folder, copy `.env.example` to `.env`:

```
cp .env.example .env
```

Open `.env` and set:
- `MONGO_URI` — your Atlas connection string (Option A) or
  `mongodb://127.0.0.1:27017/drug-inventory` (Option B)
- `JWT_SECRET` — any long random string (mash your keyboard)
- `PORT` — leave as `5000` unless it's taken

## 3. Install dependencies & seed the database

Open this `backend/` folder in VS Code, open a terminal (`` Ctrl+` ``), then:

```
npm install
npm run seed
```

`npm run seed` clears any existing data and creates:
- 3 demo users (password for all: `password123`)
  - `admin@dital.demo` → Admin
  - `pharmacist@dital.demo` → Pharmacist
  - `distributor@dital.demo` → Distributor
- 7 sample drug records (matching the earlier demo)
- 3 sample orders

## 4. Run the server

```
npm run dev
```

You should see:

```
MongoDB connected: ...
Drug Inventory API running → http://localhost:5000
```

Open **http://localhost:5000** in your browser — that's the full app,
now backed by a real database instead of localStorage. Log in with one
of the seeded accounts above, or just type any new email + password and
it will auto-create an account with the role you pick.

## 5. Test the API directly (optional, good for your review)

With the server running, in a second terminal:

```bash
# Health check
curl http://localhost:5000/api/health

# Log in and grab a token
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@dital.demo","password":"password123"}'

# Use the token to fetch stock (replace TOKEN below)
curl http://localhost:5000/api/drugs \
  -H "Authorization: Bearer TOKEN"
```

Or import the routes into **Postman** / **Thunder Client** (VS Code
extension) for a nicer interface — this is exactly what the "Postman
(API testing)" line in your Tech Stack slide refers to.

## API Reference

| Method | Endpoint                    | Auth required        | Description                        |
|--------|------------------------------|-----------------------|-------------------------------------|
| POST   | /api/auth/register            | No                    | Create an account                   |
| POST   | /api/auth/login                | No                    | Log in, returns a JWT               |
| GET    | /api/auth/me                    | Yes                   | Get the logged-in user              |
| GET    | /api/auth/users                 | Yes (Admin)           | List all users                      |
| GET    | /api/drugs                       | Yes                   | List / search / filter stock        |
| GET    | /api/drugs/alerts/summary        | Yes                   | Low-stock & near-expiry lists       |
| POST   | /api/drugs                       | Yes (Admin/Pharmacist)| Add a drug/batch record             |
| PUT    | /api/drugs/:id                    | Yes (Admin/Pharmacist)| Update a drug/batch record          |
| DELETE | /api/drugs/:id                    | Yes (Admin/Pharmacist)| Delete a drug/batch record           |
| GET    | /api/orders                       | Yes                   | List orders (optionally by status)  |
| POST   | /api/orders                       | Yes (Admin/Distributor)| Create a new order                 |
| PUT    | /api/orders/:id/status              | Yes (Admin/Distributor)| Advance order status               |
| GET    | /api/alerts/status                  | Yes                   | Is e-mail switched on?              |
| POST   | /api/alerts/send                    | Yes (Admin/Pharmacist)| E-mail the low-stock / expiry list now |

## E-mail alerts

The app e-mails the low-stock and near-expiry list in three situations:
1. You click **Send alert e-mail now** on the Alerts page (Admin or Pharmacist).
2. You save a drug that is already low on stock or near expiry.
3. Automatically every `ALERT_INTERVAL_HOURS` hours (default 24) while the server is running.

### Gmail on your laptop
1. In your Google account, turn on **2-Step Verification** (Security page).
2. Open https://myaccount.google.com/apppasswords, type any name (for example `drug-inventory`), click **Create**, and copy the 16-letter password. Remove the spaces.
3. In `.env` add:
   ```
   EMAIL_USER=yourname@gmail.com
   EMAIL_PASS=the16letterpassword
   ALERT_EMAIL_TO=yourname@gmail.com
   ALERT_INTERVAL_HOURS=24
   ```
   `EMAIL_PASS` is the App Password, not your normal Gmail password. `ALERT_EMAIL_TO` can hold several addresses separated by commas.
4. Run `npm install` (this installs nodemailer), then restart the server with `npm run dev`.
5. Log in, open **Alerts**. The panel should say "E-mail alerts are ON". Click **Send alert e-mail now** and check the inbox (also the Spam folder).

### On Render's free plan
Render blocks the Gmail (SMTP) ports on free web services, so Gmail will not work there. Use Brevo, which sends through a normal web (HTTPS) call:
1. Create a free account at brevo.com and verify the sender e-mail address you want to send from.
2. Create an API key in Brevo (SMTP & API, then API keys).
3. In Render, add these Environment Variables: `BREVO_API_KEY`, `EMAIL_FROM` (the verified sender address) and `ALERT_EMAIL_TO`.
4. Redeploy. If `BREVO_API_KEY` is set, it is used instead of Gmail.

Check Brevo's current free-plan limits on their website. A free Render service goes to sleep when nobody uses it, so the daily timer only runs while the app is awake. The button and the "drug saved" e-mails still work.

## QR / barcode scanning

- **Add Drug / Batch, then "Scan QR / barcode to fill this form"**: fills the form from the code.
- **Stock page, "Scan to search"**: scans a batch code and shows only that batch.
- **Stock page, "QR" button on each row**: shows a QR code for that drug (print it and stick it on the box).

The QR text format is `name|category|manufacturer|batchNo|mfgDate|expDate|qty|warehouse`, for example:

```
Dolo 650|Analgesic|Micro Labs|B-7001|2026-09-01|2027-09-01|45|Chennai Central
```

A code that holds only a batch number (for example `B-2201`) fills the batch field only. JSON text also works.

Notes:
- The browser allows the camera only on `http://localhost` and on `https://` sites. A phone opening `http://192.168.x.x:5000` will not get the camera. Use the deployed https link, or use the **picture** option in the scanner window.
- The scanner and QR libraries load from the internet (CDN), so the computer must be online.
- If there is no camera, choose a saved picture of the code in the scanner window.

## Put the code on GitHub and deploy it

1. Create a free account on github.com and a **new repository** (Public), for example `drug-inventory-supply-chain-tracking`.
2. Click **uploading an existing file**, drag in the contents of this `backend` folder, and commit. **Do not upload** `.env` or `node_modules`.
3. The address in the browser bar (`https://github.com/<your-name>/<repo-name>`) is your **GitHub link** for the report.
4. Create a free account on render.com. **New, Web Service**, connect the GitHub repo.
5. Build Command `npm install`, Start Command `npm start`.
6. Add Environment Variables: `MONGO_URI`, `JWT_SECRET`, and the e-mail settings above (use the Brevo ones on Render).
7. In MongoDB Atlas, Network Access, allow access from anywhere.
8. Click **Deploy**. The `https://....onrender.com` address is your **live website link**.

## Updating your PPT after this works

Once you've run this locally and it works, you can honestly update the
Review slides:
- **Backend Development** — remove "(Planned)", it's now real
- **Database Integration** — remove "(Planned)", MongoDB is connected
- **Module-wise Implementation Status** — bump Backend APIs & Database
  Integration up from 10% to reflect what's actually working
- **Screenshots** — same UI as before, just now backed by real data

## Troubleshooting

- **"MongoDB connection failed"** → double-check `MONGO_URI` in `.env`,
  and that your Atlas IP allowlist includes your current IP (or is `0.0.0.0/0`)
- **"Port 5000 already in use"** → change `PORT` in `.env` to something
  like `5050`
- **Login says "Invalid email or password"** → run `npm run seed` again,
  or just register a brand new email from the login screen
