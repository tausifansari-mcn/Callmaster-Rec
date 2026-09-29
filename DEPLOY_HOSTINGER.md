# Deploying to Hostinger (shared/Business hosting, Node.js app)

This deploys the whole site as **one Node.js app** in Hostinger's hPanel: the same Express server
that runs the API also serves the built React site (`SERVE_FRONTEND=true`), so you only create one
app in hPanel, not two.

The database is now **Hostinger's own MySQL database** (`u279037117_db_callmaster`), on the same
hosting account — reachable as `localhost`, so there's no firewall/remote-IP problem to solve anymore.

The repo root has its own `package.json` with two scripts written for exactly this deploy:
```
"build": "npm install --prefix backend --omit=dev && npm install --prefix frontend --include=dev && npm --prefix frontend run build",
"start": "node backend/src/server.js"
```
`build` installs both apps' dependencies and compiles the frontend; `start` runs the API, which also
serves that compiled frontend. Whichever way you deploy (Git or manual upload), these two are what
actually run.

`backend/.env.production` has your real production settings, ready to upload as `backend/.env`. It is
**not committed to git** — secrets never leave your machine through git. Only one thing in it needs
editing before you upload it: **`PUBLIC_SITE_URL`** — set it to your real domain (e.g. `https://callmaster.in`).
It's used in the customer welcome-email login link and calendar invites.

---

## Which deploy method are you using?

- **A — Git-connected** (hPanel → Advanced → Git, pointed at this GitHub repo): pushing to `main`
  updates the files on the server; you (or a webhook) then trigger a pull/redeploy. Go to **Path A**.
- **B — Manual upload** (File Manager / FTP): you upload the files yourself each time. Go to **Path B**.

Both end up running the same `build` then `start` commands — the difference is just how the files get
onto the server.

---

## Path A — Git-connected deploy

1. **hPanel → Advanced → Git** → connect this repository (`tausifansari-mcn/Callmaster-Rec`), branch `main`.
2. Set the deployment path to wherever you want the repo checked out (e.g. `callmaster-website-code`).
3. Upload `backend/.env.production` **separately** (File Manager/FTP), as `backend/.env`, inside the
   checked-out `backend/` folder. **`.env` is git-ignored on purpose — it will never arrive via git**,
   so this one file always needs a manual upload/edit on the server itself, once, then again only when
   a value changes.
4. **hPanel → Advanced → Node.js** → create (or edit) the app:

   | Field | Value |
   |---|---|
   | Node.js version | Highest available (20+) |
   | Application root | The repo folder from step 2, e.g. `callmaster-website-code` (the **root**, not `backend/`) |
   | Application URL | Your domain or subdomain |
   | Application startup file | `backend/src/server.js` |

5. On the Node.js app screen, run whatever build hook is available — either a **Build command** field
   (set it to `npm run build`) if hPanel shows one, or click **NPM Install** and then use the app's
   **Run command / Console** to run `npm run build` once by hand if there's no separate build field.
6. Click **Deploy**/**Sync** in the Git section to pull the latest push, then **Restart** the Node.js app.

From then on: `git push` → pull/sync in hPanel's Git screen → Restart. `backend/.env` never changes
through this flow — it stays as whatever you uploaded directly.

---

## Path B — Manual upload

1. Build locally:
   ```bash
   npm run build
   ```
   (this is the root script — it builds both backend deps and the frontend in one go)
2. Upload, keeping this exact layout:
   ```
   callmaster-website-code/
   ├── package.json          ← the root one, with build/start
   ├── backend/
   │   ├── src/
   │   ├── database/
   │   ├── package.json
   │   ├── package-lock.json
   │   └── .env              ← backend/.env.production, renamed to .env
   └── frontend/
       └── dist/              ← produced by the build above
   ```
   **Do not upload:** `node_modules/` (either folder — Hostinger/your build step installs these),
   `.git/`, `reference/`, `backend/tests/`, `frontend/src/`, `backend/uploads/` (leave empty), any
   `.env*` file other than the one renamed to `backend/.env`.
3. **hPanel → Advanced → Node.js** → create the app with the **same fields as Path A step 4**
   (Application root = the repo root folder, startup file = `backend/src/server.js`).
4. Click **NPM Install**, then **Restart**.
5. Every time you change code: rebuild locally, re-upload the changed files, **Restart**.

---

## Check it worked

Open your domain. You should see the CallMaster homepage. Then check:
- `https://yourdomain.com/api/health` → `{"ok":true,...}`
- `https://yourdomain.com/admin` → sign in with the admin email/password from `.env`

Check the Node.js app's **Log** in hPanel — on a good start it reads:
```
[db] schema ready (15 tables checked)
[db] connected to MySQL localhost/u279037117_db_callmaster
[server] API listening on http://localhost:...
```
If it doesn't come up, the log almost always says exactly why (missing `.env`, a bad DB credential, a
missing `frontend/dist`) — paste it back and it's usually a one-line fix.

---

## Before you consider it fully live

- [ ] `PUBLIC_SITE_URL` in `backend/.env` is your real domain (not a placeholder)
- [ ] Send yourself a test order and confirm the OTP and welcome emails arrive (Admin → Email &
      notifications → Send a test email)
- [ ] Change the admin password (Admin → My account)
- [ ] Fill in Site settings (domain, company name, logo) so the placeholder text disappears
- [ ] Decide on `PAYMENT_MODE` — it's currently `sandbox` (no real money moves). Switch to `razorpay`
      and add your live `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` only when you're ready to take real
      payments
- [ ] Hostinger issues a free SSL certificate for the domain automatically — confirm `https://` works
      and doesn't show a warning
