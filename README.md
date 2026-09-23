# CallMaster Website — Sandbox Build

Single self-contained HTML file (`index.html`) — no build step, no external dependencies beyond Google Fonts (loaded via `<link>` tags in `<head>`). Open directly in a browser, or serve with any static file server:

    python3 -m http.server 8000

## What's inside
- All markup, CSS and JavaScript live in this one file, organized by page section (`<!-- ============ SECTION ============ -->` comments mark each page).
- Client-side page router (`goto()`) swaps `.page` sections in/out — no page reloads.
- Self-serve purchase modal (`CMPurchase.open` / `CMPurchase.openCart`) with a sandboxed OTP + Razorpay-style checkout flow (no real payment gateway wired up — see below).
- Per-product pricing calculators: Cloud Telephony (license/channel/DID stepper), Voice Bot (setup + regional language add-ons), Dialers (tiered seat-count calculator).
- Rule-based helpline chatbot (`KEYWORD_RULES` array), fully client-side, no external AI service.
- Deep Customer Insights and Voice Bot demo wizards with simulated processing/results (mock data, for UI/UX demonstration only).

## What's NOT real (needs engineering before production)
- **Payment**: the checkout simulates Razorpay — no real `Checkout.js`, no order creation, no signature verification. Needs real Razorpay integration with server-side order creation + payment verification.
- **OTP**: email OTP is generated and shown directly in the UI (sandbox convenience) — needs a real email-send + server-side verification.
- **Forms**: lead-capture and contact forms show a success state locally; nothing is actually submitted to a CRM or backend.
- **Audio upload / call scoring**: the Deep Customer Insights wizard shows randomized mock scores — no real transcription or scoring pipeline.
- **Legal pages**: contain `[domain]` / `[operating entity name]` placeholders pending final decisions.
- **No favicon**: flagged, pending a design decision on what mark to use.

## Recommended next steps for engineering
1. Split into templates/components if moving off a single static file (e.g. for a CMS or app framework).
2. Wire real Razorpay order creation + webhook verification server-side.
3. Replace client-side OTP generation with a real send/verify flow.
4. Connect lead-capture and contact forms to a CRM/backend.
5. Replace legal-page placeholders with final entity name and domain.
