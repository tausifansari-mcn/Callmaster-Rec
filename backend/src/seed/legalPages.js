/** The five legal pages from the original site. Body text: blank line = new paragraph, **bold**, [text](/path). */
export const LEGAL_PAGES = [
  {
    slug: 'terms', title: 'Terms & Conditions', order: 1,
    sections: [
      { heading: 'Acceptance of Terms', body: 'By creating an account, completing checkout, or otherwise using any CallMaster product — Deep Customer Insights, Voice Bot, Dialers, Email Automation, WhatsApp Business API, or Cloud Telephony — you agree to these Terms. If you\'re accepting on behalf of an organization, you confirm you have authority to bind that organization.' },
      { heading: 'Description of Services', body: 'CallMaster provides contact-center software and services delivered as monthly subscriptions, one-time setup engagements, and usage-based (metered) billing, as described on the pricing page for each product. Some products are purchased instantly through self-serve online checkout; others require a sales conversation before onboarding.' },
      { heading: 'Self-Serve Purchase & Payment', body: 'Self-serve purchases are processed online via Razorpay. Before payment, we verify your official business email via a one-time password (OTP) — we do not accept free/personal email domains (Gmail, Yahoo and similar) for billing accounts, consistent with our B2B-only positioning. You must provide a valid GST number where applicable; the invoice raised will reflect the GST-registered entity you supply. Prices shown at checkout are indicative until confirmed on the final payment summary, which includes GST at the prevailing rate (18% at the time of writing).' },
      { heading: 'Usage-Based Billing', body: 'Products with metered pricing — including Voice Bot (per-minute voice usage) and WhatsApp Business API (per-message interaction charges, passed through from Meta at cost) — are billed monthly in arrears based on actual usage, in addition to any prepaid plan or one-time setup fee. Usage rates are disclosed on the relevant product page and are not part of the prepaid checkout total, since volume cannot be known in advance.' },
      { heading: 'Promo Codes & Discounts', body: 'Discretionary promo/discount codes, where offered, are applied at the payment step of checkout, deducted from the subtotal before GST is calculated. Codes are single-use per order unless stated otherwise, non-transferable, cannot be combined unless explicitly permitted, and may be withdrawn or changed at any time without notice for orders not yet completed.' },
      { heading: 'Demo & Trial Usage Limits', body: 'One credit per verified number, per email/organization, across the Insights and Voice Bot demos. Demo usage is for evaluation only and is not a commitment to purchase.' },
      { heading: 'User Obligations', body: 'You confirm you have the right to submit any recording you upload, that registration and billing details you provide are accurate, and that your use of WhatsApp/voice/email channels complies with applicable telecom, TRAI/DND, and messaging-platform (Meta) policies.' },
      { heading: 'Suspension & Termination', body: 'We may suspend or terminate access for non-payment, breach of these Terms, misuse of the platform, or violation of a channel provider\'s policies (e.g. Meta\'s WhatsApp commerce/messaging policy). You may cancel a subscription any time — see our Refund & Cancellation Policy for how billing is handled on cancellation.' },
      { heading: 'Disclaimer', body: 'Demo outputs are illustrative and may not reflect production accuracy. Services are provided "as is" with reasonable commercial efforts toward uptime and quality; we do not guarantee uninterrupted or error-free operation.' },
      { heading: 'IP, Liability & Governing Law', body: 'All CallMaster software, frameworks (CLAP, MAGIC Script, RESO) and content remain our intellectual property. Our aggregate liability under these Terms is limited to fees paid in the preceding three months for the affected service. These Terms are governed by the laws of India, with courts at our registered office location having exclusive jurisdiction.' },
    ],
  },
  {
    slug: 'privacy', title: 'Privacy Policy', order: 2,
    sections: [
      { heading: 'Operating Entity', body: 'This Privacy Policy applies to CallMaster\'s website, self-serve checkout, and product usage, operated in accordance with India\'s Digital Personal Data Protection Act, 2023 ("DPDP Act") and applicable telecom regulations.' },
      { heading: 'What We Collect', body: 'Account & billing data (name, organization, official email, phone, GST number); usage data (call minutes, message counts, license/seat counts, configuration choices); content you submit (uploaded call recordings for Deep Customer Insights, scope-of-work documents for Voice Bot onboarding); and technical data (device/browser info, pages visited) collected via cookies and similar technologies.' },
      { heading: 'How We Use It', body: 'To provision and bill your account, verify your identity via OTP before checkout, process uploaded audio for scoring (CLAP/MAGIC Script/RESO), operate usage-based billing for voice and WhatsApp products, respond to support and chatbot queries, and — with consent — send product and marketing communications.' },
      { heading: 'Consent', body: 'Collected separately for: (1) receiving a demo call, (2) processing uploaded audio for the Deep Customer Insights demo or paid service, (3) follow-up/marketing contact, and (4) OTP-based verification at checkout. You may withdraw marketing consent at any time.' },
      { heading: 'Chatbot Data', body: 'Our on-site helpline chatbot is a rule-based assistant that runs entirely in your browser; any free-text questions you type are matched against a keyword list and are not sent to a third-party AI service or stored on our servers. If a future version routes conversations to a live agent or an AI backend, that will be disclosed at the point of use.' },
      { heading: 'Third-Party Processors', body: 'We rely on payment processing (Razorpay), messaging infrastructure (Meta, for WhatsApp Business API), telecom carriers/DID providers (for Cloud Telephony and Voice Bot calling), and standard cloud hosting — each bound by their own data-processing terms and used only to the extent needed to deliver the relevant service.' },
      { heading: 'Retention', body: 'See our Data Retention Policy for specific timelines by data type. In general, uploaded audio and demo recordings are deleted within 30 days; billing and invoicing records are retained as required by Indian tax law (typically up to 8 years).' },
      { heading: 'Your Rights (DPDP Act 2023)', body: 'You may request access, correction, erasure, or grievance redressal regarding your personal data. Contact: privacy@[domain]. We will acknowledge requests within a reasonable timeframe and resolve them in line with DPDP Act obligations.' },
    ],
  },
  {
    slug: 'cookie-policy', title: 'Cookie Policy', order: 3,
    sections: [
      { heading: 'Cookies We Use', body: 'Strictly necessary cookies (session state, keeping you logged into an in-progress checkout, remembering your one-trial-per-number demo status); analytics cookies (understanding site usage so we can improve pages and the checkout flow); and, where enabled, marketing cookies used to measure campaign performance. This site also uses browser localStorage — not a cookie, but functionally similar — to enforce the "one demo call per number" limit.' },
      { heading: 'Why We Use Them', body: 'To keep the self-serve checkout and demo wizards working correctly across steps, to understand which product pages and pricing sections get the most engagement, and to avoid showing the same person a duplicate free demo.' },
      { heading: 'Managing Preferences', body: 'Most browsers let you block or delete cookies via their settings; doing so may prevent the checkout flow, demo wizards, or chatbot widget from working correctly. Where we run a formal cookie-consent banner, it will let you opt out of non-essential (analytics/marketing) cookies while keeping strictly necessary ones active.' },
      { heading: 'Third-Party Cookies', body: 'Payment processing (Razorpay) and any embedded analytics tools may set their own cookies during checkout or page visits, governed by their respective privacy policies.' },
    ],
  },
  {
    slug: 'data-retention', title: 'Data Retention Policy', order: 4,
    sections: [
      { heading: 'Uploaded Audio & Transcripts', body: 'Deleted within 30 days of upload, or at the end of your demo session, whichever is earlier — for both the free Deep Customer Insights demo and paid audits, unless you\'ve asked us to retain a longer historical archive as part of a paid plan.' },
      { heading: 'Voice Bot Demo Recordings & Scope of Work', body: 'Demo call recordings follow the same 30-day maximum retention window. Scope-of-work files uploaded during Voice Bot purchase are retained for the duration of your onboarding engagement plus 90 days, then deleted unless required for an active support case.' },
      { heading: 'Billing & Invoicing Records', body: 'Invoices, GST records, and payment confirmations (including Razorpay transaction references) are retained for the period required under Indian tax law — typically up to 8 years — even after you cancel a subscription.' },
      { heading: 'Usage & Call Detail Records', body: 'Call detail records (duration, timestamps, routing) for Cloud Telephony and Voice Bot, and message logs for WhatsApp Business API, are retained for the length of your active subscription plus 180 days for billing-dispute and compliance purposes, then purged or anonymized.' },
      { heading: 'Lead & Chatbot Data', body: 'Name, organization, email, and phone submitted via lead-capture forms are retained for CRM/follow-up purposes per your stated consent. Chatbot conversation logs are session-based and not persisted server-side.' },
      { heading: 'Deletion Requests', body: 'Contact privacy@[domain] to request deletion at any time; we\'ll action it within the timelines required by the DPDP Act, subject to records we\'re legally obligated to keep (e.g. tax/invoicing data).' },
    ],
  },
  {
    slug: 'refund-policy', title: 'Refund & Cancellation Policy', order: 5,
    sections: [
      { heading: 'Overview', body: 'This policy covers subscriptions and one-time charges purchased through CallMaster\'s self-serve online checkout (Razorpay), across all products — Deep Customer Insights, Voice Bot, Dialers, Email Automation, WhatsApp Business API, and Cloud Telephony.' },
      { heading: 'Cancellation Windows', body: 'Monthly subscriptions (Dialers, Email Automation, WhatsApp Business API plan fees, Cloud Telephony license/channel/DID fees) can be cancelled any time from your account or by writing to support@[domain]. Cancellation takes effect at the end of your current billing cycle — you retain access, and continue to be billed for usage, through the end of that cycle; there is no automatic pro-rated refund for the unused portion of a mid-cycle cancellation unless required by law or explicitly agreed in writing.' },
      {
        heading: 'Refund Eligibility',
        body: [
          '**Unused subscription balance:** if you cancel within 48 hours of an initial purchase and have not materially used the service (e.g. no calls placed, no messages sent, no licenses provisioned), you\'re eligible for a full refund of that charge. Beyond 48 hours, refunds are considered case by case.',
          '**One-time setup fees (e.g. Voice Bot\'s ₹30,000 setup, or per-language add-ons):** non-refundable once build/configuration work has commenced, since these cover engineering and integration effort committed on your scope of work. If work has not yet started, a setup fee is refundable in full within 7 days of purchase.',
          '**DID / number porting:** charges tied to acquiring or porting a phone number (including the mobile look-alike DID format under Cloud Telephony) are non-refundable once the number has been provisioned or a porting request has been submitted to the carrier, as these involve third-party/regulatory processes we cannot reverse.',
          '**Usage-based charges:** per-minute voice usage and per-message WhatsApp interaction charges are billed for actual usage already incurred and are not refundable, except in the case of a documented billing/metering error on our part.',
        ].join('\n\n'),
      },
      { heading: 'How to Request a Refund or Cancellation', body: 'Email support@[domain] with your registered email, order ID (shown on your payment confirmation), and the reason for the request. For urgent cases, you may also raise this via the on-site chatbot, which will route you to our team.' },
      { heading: 'Processing Timelines', body: 'Refund requests are acknowledged within 2 business days. Approved refunds are issued to the original payment method via Razorpay within 7–10 business days of approval; actual credit-back time on your bank/card statement depends on your bank.' },
      { heading: 'Chargebacks', body: 'Please contact us before raising a chargeback with your bank — most billing questions can be resolved faster directly. Chargebacks raised without first contacting support may result in suspension of the associated account pending resolution, and repeated unwarranted chargebacks may affect eligibility for future self-serve checkout.' },
      { heading: 'Promo Codes & Discounts on Refunds', body: 'If an order was placed using a promo/discount code, any refund is calculated on the amount actually paid (post-discount, pre-GST, with GST refunded proportionately) — not on the pre-discount list price. A refunded promo code is not reissued or extended automatically; contact support if you\'d like to reuse it on a future order at our discretion.' },
    ],
  },
];
