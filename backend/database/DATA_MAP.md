# Where each piece of data is saved (database `db_masmin`)

Schema: [`schema.sql`](schema.sql) (applied automatically on start-up). Times are stored in UTC.

## 1. Website visitors → tables

| Visitor action | Table | When it is written |
|---|---|---|
| **Insights demo, step 1** — name, organization, email → **Continue** → enter the 4-digit code emailed to that address | `demo_sessions` (`type='audit'`); code in `otps` (purpose `audit-demo`, hashed, 10 min) | Saved **only after the code is verified** — nobody can register an address they don't own. `audit_status = registered`. Pressing Continue again, or going Back and editing, updates the same row (no duplicates). |
| **Insights demo, step 2** — recording + line of business → **Get results** | `demo_sessions` (same row) | Recording saved to `backend/uploads/audio/`; `file_*`, `lob`, `framework` filled; `audit_status = processing`, `audit_stage = transcribing → auditing` |
| **Audit finished** | `demo_sessions` (same row) | Deepgram transcript → `transcript`; Claude audit → `results`; `audit_status = completed`. On failure: `audit_status = failed` + `audit_error` |
| **Voice Bot demo, step 5** — name, organization, email + bot choices → **Continue** | `demo_sessions` (`type='voice'`) | **Immediately** on Continue. `call_status = registered`, with industry / call type / gender / language |
| **Voice Bot demo, last step** — verified phone + consent → **Call me now** | `demo_sessions` (same row) | `phone`, `consent`, `call_status = simulated / requested / failed` |
| **Contact page** form (work email + 10-digit phone required) | `contacts` | On submit |
| **Book a call** (Home and Contact pages) | `appointments` | On submit — one row per booked slot (`slot_start` in UTC, `slot_label` in IST). A cancelled row frees the slot. The offered slots come from Site settings (`bookingTimes`, `bookingDaysAhead`, `bookingCapacity`) |
| **Insights pricing request** form | `leads` | On submit |
| **Checkout** (buy a plan / configure & buy) | `orders` + `order_items` | Order row when the customer reaches the payment step (`status = pending`); becomes `paid` after payment. Line items (licenses, channels, languages…) go to `order_items`. Scope-of-work file → `backend/uploads/sow/` |
| **Checkout consent** (DPDP tick-box) | `orders.dpdp_consent_at` | Stored with the order; the server refuses an order without it |
| **Paid order → customer login** | `customer_accounts` (+ `orders.customer_account_id`) | Created when the order is paid; password stored only as a bcrypt hash |
| **Cloud Telephony welcome offer** | `orders.welcome_offer` | `1` for Cloud Telephony orders |
| **Cancel a Cloud Telephony order** (checkout screen / dashboard / site form) | `cancellation_requests`; `orders.status` → `cancelled` / `refunded`, `orders.cancelled_at` | On submit. Requests that match no order are kept too (`matched = 0`) |
| **White paper unlock** — name + work email | `whitepaper_leads` | On submit (`delivered = 1` when the PDF link was handed out). The papers themselves are in `whitepapers` |
| **Email / phone OTP** codes | `otps` | When a code is sent (hashed, expires in 10 min) |

## 2. Admin panel → tables

| Admin action | Table |
|---|---|
| Sign-in accounts, roles | `admins` |
| Pricing, home text, FAQs, chatbot rules, site settings, **email/SMTP settings** (password encrypted) | `settings` (one JSON row per area) |
| Legal pages and custom pages | `pages` |
| Promo codes | `promo_codes` (`used_count` goes up when an order is paid) |
| White papers + their PDFs | `whitepapers` (PDF file in `backend/uploads/whitepapers/`) |
| Home hero video | `settings` → `home.heroVideoFile` (video in `backend/uploads/branding/`) |
| Booked-call status / notes | `appointments` |
| Logo | `settings` → `site.logoFile` (image in `backend/uploads/branding/`) |
| Insights page copy, chat nudge, cancellation window, example promo code | `settings` (`insights`, `chatbot`, `site`) |
| Cancellation status / notes, white-paper lead status / notes | `cancellation_requests`, `whitepaper_leads` |
| Customer accounts (disable, temporary password reset) | `customer_accounts` |
| Order status / notes, lead status / notes, contact status / notes | `orders`, `leads`, `contacts` (`status`, `notes` columns) |

## 3. The `demo_sessions` row, step by step

One row per demo visitor, filled in as they progress:

| Column | Insights (audit) | Voice Bot |
|---|---|---|
| `type` | `audit` | `voice` |
| `name`, `company`, `email` | step 1 | step 5 |
| `audit_status` | `registered` → `processing` → `completed` / `failed` | — |
| `call_status` | — | `registered` → `simulated` / `requested` / `failed` |
| `lob`, `framework` | step 2 (e.g. Inbound Support / CLAP) | — |
| `file_original_name`, `file_stored_name`, `file_size` | the uploaded recording | — |
| `audit_stage` | `transcribing` → `auditing` (while running) | — |
| `transcript` | Deepgram speech-to-text with speaker labels (JSON) | — |
| `results` | Claude's audit report: score, parameters, framework read, compliance, coaching (JSON) | — |
| `audit_error` | technical failure reason (admin-only) | — |
| `industry`, `call_type`, `gender`, `language` | — | bot configuration |
| `phone`, `consent` | — | verified number and consent |
| `access_token` | secret that lets the visitor's own browser fetch its report | secret that finishes the same record |
| `ip`, `created_at`, `updated_at` | always | always |

"Registered" rows are people who finished step 1 but never uploaded a call / placed the call. They show in
**Admin → Demo activity** as *Signed up — no call yet* and are counted separately on the dashboard.

## 4. Not tables

* Uploaded recordings and scope-of-work documents are **files** in `backend/uploads/` (the database stores their names).
  Recordings are deleted automatically after `DATA_RETENTION_DAYS` (default 30); the row and its transcript/report stay.
* `md_products` is not part of this project and is never read or written.
