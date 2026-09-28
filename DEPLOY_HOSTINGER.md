# Deploying to Hostinger (shared/Business hosting, Node.js app)

This deploys the whole site as **one Node.js app** in Hostinger's hPanel: the same Express server
that runs the API also serves the built React site (`SERVE_FRONTEND=true`), so you only create one
app in hPanel, not two. The database stays where it already is — the remote MySQL server at
`122.184.128.90` — nothing is migrated.

Two files were prepared for you:

| File | What it is |
|---|---|
| `backend/.env.production` | Your real production settings, ready to upload as `backend/.env`. **Not committed to git.** |
| `frontend/dist/` | The built site (just built — rebuild with `npm run build` any time you change the frontend). |

Only one thing in `backend/.env.production` needs editing before you upload it: **`PUBLIC_SITE_URL`**
— set it to your real domain (e.g. `https://callmaster.in`). It's used in the customer welcome-email
login link and calendar invites.

---

## Step 1 — Check the database will accept Hostinger's connections

This is the part most likely to trip you up, because the database isn't on Hostinger — it's the
separate MySQL server you already use. Before creating the app, confirm:

1. That MySQL server allows **remote** connections (not just `localhost`) — `bind-address` in its
   `my.cnf` must not be `127.0.0.1`.
2. The MySQL user `root` (or a dedicated user) is allowed to connect **from any host**, or specifically
   from Hostinger's server IP. Check with:
   ```sql
   SELECT host FROM mysql.user WHERE user = 'root';
   ```
   If it only shows `localhost`, you'll need a host entry of `%` (any host) or Hostinger's specific IP.
3. Its firewall / security group allows inbound traffic on port `3306` from Hostinger.

If that server is only reachable from your office network today, ask whoever manages it to open it up
for this — there's no way around it while the database stays off-Hostinger.

---

## Step 2 — Build the frontend locally

```bash
cd frontend
npm run build
```

This produces `frontend/dist/`. Do this on your own machine, not on Hostinger — shared Node.js hosting
isn't meant for running a full Vite build, and re-uploading a pre-built `dist/` is faster and more
reliable. Rebuild and re-upload it every time you change anything in `frontend/src`.

---

## Step 3 — Upload the files

Using Hostinger's File Manager or an FTP/SFTP client, create a folder for the app (e.g.
`callmaster-website-code`) and upload:

```
callmaster-website-code/
├── backend/
│   ├── src/
│   ├── database/
│   ├── package.json
│   ├── package-lock.json
│   └── .env              ← upload backend/.env.production, renamed to .env
└── frontend/
    └── dist/              ← the folder you just built
```

**Do not upload:**
- `node_modules/` (either folder) — Hostinger installs these itself in Step 4
- `.git/`, `reference/`, `backend/tests/`, `frontend/src/` (the built `dist/` is all the server needs)
- `backend/uploads/` — leave it empty; it fills up on its own as people upload files
- Any other `.env*` file except the one renamed to `backend/.env`

The `backend/` and `frontend/dist/` folders must sit **next to each other**, exactly as above — the
server looks for the built site at `../frontend/dist` relative to `backend/`.

---

## Step 4 — Create the Node.js app in hPanel

In hPanel: **Advanced → Node.js → Create Application**, then set:

| Field | Value |
|---|---|
| Node.js version | The highest available (20 or later) |
| Application mode | Production |
| Application root | The `backend` folder you uploaded, e.g. `callmaster-website-code/backend` |
| Application URL | Your domain or subdomain |
| Application startup file | `src/server.js` |

Save, then click **NPM Install** on the app (installs everything listed in `backend/package.json`).

Hostinger's Node.js apps also have their own **Environment Variables** section in the same screen —
you can leave it empty. The app reads `backend/.env` directly (the file you uploaded in Step 3), so
nothing needs to be duplicated there. If you'd rather set them there instead of a file, the values are
the same ones in `backend/.env.production`.

Click **Restart** to start the app.

---

## Step 5 — Check it worked

Open your domain. You should see the CallMaster homepage. Then check:
- `https://yourdomain.com/api/health` → `{"ok":true,...}`
- `https://yourdomain.com/admin` → sign in with the admin email/password from `.env`

The first time it starts, it connects to `db_masmin` and creates any tables it doesn't find yet (same
auto-migration behaviour as in development) — check the app's log in hPanel if it doesn't come up;
almost every first-deploy failure here is Step 1 (the database refusing the connection).

---

## Redeploying after a change

- **Frontend change:** `npm run build` locally → re-upload `frontend/dist/` → no restart needed (it's
  static files).
- **Backend change:** upload the changed files under `backend/src/` → click **Restart** on the app in
  hPanel.
- **A price, page, FAQ, key, etc.:** no upload needed at all — that's exactly what the admin panel is
  for.

---

## Before you consider it fully live

- [ ] `PUBLIC_SITE_URL` in `backend/.env` is your real domain (not the placeholder)
- [ ] Send yourself a test order and confirm the OTP and welcome emails arrive (Admin → Email &
      notifications → Send a test email)
- [ ] Change the admin password (Admin → My account)
- [ ] Fill in Site settings (domain, company name, logo) so the placeholder text disappears
- [ ] Decide on `PAYMENT_MODE` — it's currently `sandbox` (no real money moves). Switch to `razorpay`
      and add your live `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` only when you're ready to take real
      payments
- [ ] Hostinger issues a free SSL certificate for the domain automatically — confirm `https://` works
      and doesn't show a warning
