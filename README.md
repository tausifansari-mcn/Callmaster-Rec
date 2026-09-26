# CallMaster Website

A React website with a Node.js/Express API, a MySQL database and a built-in admin panel.
It is a full rebuild of the original single-file `index.html` (kept for reference in
[`reference/original-index.html`](reference/original-index.html)) — the design is unchanged, but everything
that used to be simulated in the browser is now stored in the database.

```
callmaster-website-code/
├── frontend/            React 19 + Vite + React Router — the public site and the admin panel (/admin)
│   └── src/
│       ├── pages/         Home, product pages, pricing, about, contact, dynamic (legal/custom) pages
│       ├── components/    layout, chat widget, purchase (checkout) modal, calculators, demo wizards, ui
│       ├── admin/         admin panel (dashboard, inbox, content editors, users)
│       ├── api/           fetch clients for the public and admin APIs
│       └── styles/        site.css (ported 1:1 from the original) and admin.css
├── backend/             Node.js + Express + MySQL (mysql2) API
│   ├── database/        schema.sql — every table for db_masmin (applied automatically on start-up)
│   ├── src/
│   │   ├── config/        env + MySQL connection pool + auto-migration
│   │   ├── repositories/  one data-access module per table (admins, leads, contacts, orders, demos, otps, promos, pages, settings)
│   │   ├── routes/        route table (public + /api/admin)
│   │   ├── controllers/   request handlers
│   │   ├── services/      pricing/quotes, OTP, payments (Razorpay), mail, SMS/voice webhooks, retention job
│   │   ├── validators/    zod schemas
│   │   ├── seed/          default content copied from the original site
│   │   └── scripts/       create-admin CLI
│   ├── tests/           API integration tests (run against a throwaway MySQL server)
│   └── uploads/         scope-of-work files and demo recordings (git-ignored)
└── reference/           the original index.html
```

## Quick start

Requirements: Node.js 18+ and a MySQL 5.7+/8.x (or MariaDB 10.3+) server.

```bash
npm run install:all            # installs root, backend and frontend dependencies
```

1. **Configure the database** — open `backend/.env` and fill in `DB_HOST`, `DB_PORT`, `DB_USER` and `DB_PASSWORD`
   (`DB_NAME` is already `db_masmin`). On start-up the API creates the database (if your MySQL user is allowed to)
   and **all tables** from [`backend/database/schema.sql`](backend/database/schema.sql); it only adds what's missing.
   The file already contains a generated `JWT_SECRET` and the first admin login (`ADMIN_EMAIL` / `ADMIN_PASSWORD`).
   `backend/.env.example` documents every available setting.
2. **Run it**

   ```bash
   npm run dev                  # API on http://localhost:5100, site on http://localhost:5173
   ```

3. Open <http://localhost:5173> for the site and <http://localhost:5173/admin> for the admin panel.
   On first start the database is seeded with the original site's content, pricing, FAQs, chatbot rules,
   legal pages, the two white-paper entries and the `MCN247X` promo code. Nothing is overwritten on later starts.

## Light and dark mode

A sun / moon button in the header (and in the admin sidebar) switches the whole site between the new **light** design (default, blue accent) and the original **dark** design (amber accent). The choice is remembered per browser.

## Admin panel (`/admin`)

| Area | What you can do |
|---|---|
| **Dashboard** | Revenue, orders, leads, messages, demo activity, 14-day chart |
| **Orders** | Every checkout — customer, GST number, uploaded scope of work, payment info; set status, add notes, export CSV |
| **Pricing requests** | Leads from the Insights pricing form — status, notes, export |
| **Contact messages** | Contact-form submissions — status, notes, export |
| **API keys (Deepgram & Claude)** | Change the Deepgram and Anthropic keys (and models) used by the call audit, with no `.env` edit, code change or restart — the next audit uses the new key. Keys are stored encrypted, only the last 4 characters are ever shown, each has a free **Test connection** button, and only a super admin can change them. A key left blank falls back to `DEEPGRAM_API_KEY` / `ANTHROPIC_API_KEY` in `backend/.env` |
| **Email & notifications** | Connect your mailbox (SMTP) from the panel — no `.env` edit needed. Get an email for every new message / pricing request / order / demo, optional auto-reply to visitors, a “Send test email” button, and **reply to a contact message straight from the panel**. The SMTP password is stored encrypted and never shown again |
| **Booked calls** | Calls booked from the “Book a call directly” widget on the Home and Contact pages (IST). Each booking emails the visitor a confirmation with a calendar invite (.ics) and notifies your team; set the status to *cancelled* to free the slot. Which times / how many days / how many bookings per slot are offered is set under Site settings |
| **Cancellations & refunds** | Cloud Telephony cancellation requests (from the site form, the checkout success screen or a customer dashboard). *Approved* cancels the order, *Refunded* marks the refund as paid and closes it — the money itself is returned from your Razorpay dashboard |
| **White paper downloads** | Everyone who left their name + work email to unlock a white paper (and whether they got the PDF) |
| **Customer accounts** | The dashboard logins created automatically when someone buys. Passwords are never visible — you can issue a new temporary one, or disable an account |
| **Demo activity** | Insights audits — click a row for the call details (file, length, languages, speakers, talk share), an **in-panel player for the recording**, the transcript, the full audit report and the **raw audit data (JSON, downloadable)** — plus Voice Bot demo calls; delete a record to reset a number's free trial |
| **Pricing** | Every price: Telephony rates, Dialer tiers, Voice Bot fees & languages, Email/WhatsApp plans (add, remove, reorder), Meta rates, GST |
| **Home page / FAQs / Chatbot** | **Hero background video** (upload an MP4 — it plays muted behind the headline), hero copy, stats, per-product FAQs, chatbot greeting, quick replies, reply rules and the idle-visitor **nudge** |
| **Insights page / White papers** | The articles and copy on `/insights`, and the white papers themselves — add/edit/hide a paper and **upload its PDF**. Until a PDF is uploaded, visitors who request the paper are saved as leads and told it is being finalised |
| **Pages & legal** | Edit the five legal pages and **add any new page** (served at `/your-url`, optional footer link) |
| **Promo codes** | Create codes with %, validity dates and usage limits |
| **Site settings** | **Logo** (header, footer and browser-tab icon — upload here), brand, domain and company name (replace the `[domain]` / `[operating entity name]` placeholders everywhere), contact emails, the example promo code shown on pricing pages, the Cloud Telephony cancellation window and refund days, sandbox badge, footer note |
| **Admin users** | Add/disable admins, roles (super admin / admin), password reset |

Prices are used by the product pages, calculators, chatbot replies and the checkout. **Checkout totals are always
recomputed on the server**, so the browser can never set its own price.

## What is real now vs. the sandbox original

| Feature | Behaviour |
|---|---|
| Forms (contact, pricing request) | Saved to MySQL and shown in the admin panel; emailed to your inbox once SMTP is set up under **Email & notifications** (or `SMTP_*` / `NOTIFY_EMAIL` in `.env`) |
| Checkout | Server-side quote → email OTP → order saved → payment → receipt email. Order IDs `CM-XX-XXXXXX` |
| Payment | `PAYMENT_MODE=sandbox` simulates Razorpay (default). Set `PAYMENT_MODE=razorpay` + keys for real Razorpay orders with signature verification |
| OTP | Real email OTP via SMTP; with `SANDBOX_MODE=true` the code is also shown on screen so you can test without SMTP |
| Voice Bot demo | Recorded in the database, one trial per number enforced server-side. Forward the call request to your voice platform with `VOICE_DEMO_WEBHOOK_URL`; phone OTP via `SMS_WEBHOOK_URL` |
| Insights demo (**real call audit**) | The recording is uploaded, **Deepgram** transcribes it with speaker separation (English/Hindi/Hinglish), then **Claude** audits the transcript against the rubric for the selected line of business — Inbound Support (CLAP), Outbound Sales & Retention (MAGIC Script CRT/CST), Collections (RESO). The visitor gets a full report: weighted scorecard with quoted evidence, framework read, compliance checks, coaching plan, key moments and transcript. Rubrics live in `backend/src/services/audit/rubrics.js`. Set `DEEPGRAM_API_KEY` and `ANTHROPIC_API_KEY` in `backend/.env`; without them the demo falls back to a clearly-labelled randomised sample. Uploads are capped per IP (6/h) and per email (`AUDIT_MAX_PER_EMAIL_DAY`, default 3/day) because every audit spends API credits. Recordings are auto-deleted after `DATA_RETENTION_DAYS` |
| Customer accounts & welcome email | Every paid order gets a dashboard login (`/account`): a first-time buyer receives a username and temporary password (they must change it at first sign-in); a returning buyer's new order is attached to their existing account. The welcome email carries the details when SMTP is set up; the checkout success screen shows them only in sandbox mode or if the email could not be sent. Set `PUBLIC_SITE_URL` in `backend/.env` so the email's login link points at your real domain |
| Cloud Telephony cancellation | Within the window (default 3 days) a customer can cancel for a full refund from the checkout success screen, their dashboard, or the public “Request cancellation” form (which only ever replies generically and only emails the address registered on the order). Non-matching / out-of-window requests wait in **Cancellations & refunds** for review |
| White papers | Name + work email unlock the PDF (short-lived signed link); every request is saved under **White paper downloads** |
| Scope-of-work upload | Stored on disk, downloadable from the order in the admin panel |

### Before going live
- `SANDBOX_MODE=false` and a working SMTP (`SMTP_*`) so OTPs are emailed instead of shown on screen.
- `PAYMENT_MODE=razorpay` with your live keys.
- Change the admin password (Admin → My account) and set `CORS_ORIGINS` if the site and API are on different domains.
- Fill in Site settings (domain, company name) and turn off the “sandbox build” badge/footer note.
- Serve everything from one server: `npm run build`, set `SERVE_FRONTEND=true` in `backend/.env`, then `npm start`.
  (Or host `frontend/dist` on a static host and set `VITE_API_BASE_URL` to the API's URL before building.)

## Scripts

| Command | |
|---|---|
| `npm run dev` | API + site with hot reload |
| `npm run build` | Production build of the frontend → `frontend/dist` |
| `npm start` | Start the API (and the built site when `SERVE_FRONTEND=true`) |
| `npm test` | Backend integration tests |
| `npm --prefix backend run create-admin -- you@co.com "Name" "password"` | Create an admin / reset a password |

## Notes
- Public site URLs: `/`, `/deep-customer-insights`, `/voice-bot`, `/dialers`, `/email-automation`, `/whatsapp-api`,
  `/cloud-telephony`, `/pricing`, `/about`, `/contact`, plus `/terms`, `/privacy`, `/cookie-policy`,
  `/data-retention`, `/refund-policy` and any page you add.
- Page text in the admin supports `**bold**`, `[link text](/contact)` and blank-line paragraphs; it is never rendered as raw HTML.
