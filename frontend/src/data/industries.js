/**
 * Content for the Industries hub (/industries) and per-industry pages (/industries/:slug).
 * Ported from the Demo prototype's Industries section (id="page-industries" and the ten
 * "page-ind-*" sections that follow it) — copy is verbatim from that source, not invented.
 *
 * Each industry: { slug, name, kicker, title, lead, uses, advantages }
 * - slug: url-safe id, matches the Demo's "ind-<slug>" ids.
 * - kicker: small eyebrow label ("Nimantran for <name>").
 * - title: the hero headline (the source's <h1>). Also reused as the one-line summary on the hub card
 *   (the Demo's hub card <small> text is identical to the detail page's <h1> for every industry).
 * - lead: the hero paragraph under the headline.
 * - uses: exactly 3 of the source's "How <industry> teams can use Nimantran" cards
 *   (the Demo actually has 4-6 per industry; these 3 were chosen to keep the real copy while giving
 *   a consistent shape across all ten pages). Each: { product: 'voice'|'audit'|'telephony'|'sip', title, text }.
 * - advantages: the source's full "Advantages for <industry>" checklist, unabridged. Each: { title, text }.
 */

export const INDUSTRIES = [
  {
    slug: 'insurance',
    name: 'Insurance',
    kicker: 'Nimantran for Insurance',
    title: 'Keep every policyholder informed, and every conversation on record.',
    lead: 'Insurers live on trust and timing: renewals missed, claims chased, disclosures read. Nimantran helps you reach policyholders on time and prove that every call said what it should.',
    uses: [
      { product: 'voice', title: 'Renewal and premium reminders', text: 'Voice bots call policyholders in their language before the due date, and hand over to an agent when a customer wants to talk.' },
      { product: 'audit', title: 'Disclosure and mis-selling checks', text: 'Score every sales call for mandatory disclosures and suitability questions, instead of sampling.' },
      { product: 'telephony', title: 'A number customers answer', text: 'Advisors call from mobile-style numbers, which helps outreach feel personal.' },
    ],
    advantages: [
      { title: 'Fewer lapsed policies', text: 'Timely, polite reminders reduce lapses that come from simply forgetting.' },
      { title: 'Audit-ready conversations', text: 'Disclosure evidence available call by call.' },
      { title: 'Local language reach', text: 'English, Hindi and Hinglish calls for customers across regions.' },
      { title: 'Lower cost per contact', text: 'Bots handle routine calls, agents handle the ones that need judgement.' },
      { title: 'One vendor, one view', text: 'Calling, bots and audits together, so quality data and call data stay joined.' },
    ],
  },
  {
    slug: 'banking',
    name: 'Banking',
    kicker: 'Nimantran for Banking',
    title: 'Serve more customers on the phone without letting quality slip.',
    lead: 'Banks and lenders make and take huge volumes of calls: service, cross-sell, EMI follow-up. Nimantran gives you automation where it is safe and full-coverage quality checks where it matters.',
    uses: [
      { product: 'voice', title: 'EMI and due-date reminders', text: 'Automated, polite reminders before and after due dates, with a live hand-over for disputes.' },
      { product: 'audit', title: 'Collections conduct monitoring', text: 'Check every collections call for tone, permitted language and required statements.' },
      { product: 'sip', title: 'Capacity for peak days', text: 'Add concurrent channels around salary dates and month-end, and release them after.' },
    ],
    advantages: [
      { title: 'Conduct you can evidence', text: 'Every call scored against your own guidelines.' },
      { title: 'Less manual QA', text: 'Move QA time from listening to coaching.' },
      { title: 'Predictable peaks', text: 'Scale channel capacity to match month-end volume.' },
      { title: 'Consistent customer experience', text: 'The same script and tone across every agent and bot call.' },
      { title: 'Pay for use', text: 'Per-minute bots and per-user lines keep cost tied to volume.' },
    ],
  },
  {
    slug: 'health',
    name: 'Health',
    kicker: 'Nimantran for Health',
    title: 'Fewer missed appointments, calmer front desks.',
    lead: 'Clinics, hospitals and diagnostics lose revenue and care quality to missed visits and unanswered calls. Nimantran handles reminders and routine questions so staff can focus on patients.',
    uses: [
      { product: 'voice', title: 'Appointment and test reminders', text: 'Bots confirm, reschedule and remind patients in their language.' },
      { product: 'telephony', title: 'One number per department', text: 'Separate lines for appointments, reports and billing, each tracked.' },
      { product: 'audit', title: 'Patient-call quality', text: 'Review how front-desk and helpline calls are handled, with coaching flags.' },
    ],
    advantages: [
      { title: 'Fewer no-shows', text: "Timely reminders fill more of the day's slots." },
      { title: 'Patients feel heard', text: 'Calm, consistent calls in their own language.' },
      { title: 'Free up front desks', text: 'Routine confirmations no longer need a person.' },
      { title: 'Know where calls go wrong', text: 'Quality scores show which calls need attention.' },
      { title: 'Careful with personal data', text: 'Data handled as set out in our Privacy Policy.' },
    ],
  },
  {
    slug: 'retail-ecommerce',
    name: 'Retail & Ecommerce',
    kicker: 'Nimantran for Retail & Ecommerce',
    title: 'Win the sale in store and online, and bring customers back for the next one.',
    lead: 'Retailers and online sellers compete on conversion, delivery and loyalty. A phone call at the right moment saves a cart, confirms an address, brings a member back to the store or prevents a return. Nimantran makes that call at scale and checks the calls your team makes.',
    uses: [
      { product: 'voice', title: 'Abandoned cart recovery', text: 'Call shoppers who left items behind, in their language, with the right nudge.' },
      { product: 'telephony', title: 'Store-level numbers', text: 'Give each store its own calling line, and each online campaign its own number, and see what works.' },
      { product: 'audit', title: 'Customer-service quality', text: 'Score support and store calls to find what your best teams do differently.' },
    ],
    advantages: [
      { title: 'Lower failed deliveries', text: 'Verify the order and address before it ships.' },
      { title: 'More recovered carts', text: 'A call converts differently from a message.' },
      { title: 'Seasonal scale', text: 'Handle festive spikes without seasonal hiring.' },
      { title: 'Personal feel', text: 'Mobile-style numbers for store and clienteling calls.' },
      { title: 'Pay per minute', text: 'Cost scales with campaigns, with no fixed team.' },
      { title: 'One view across channels', text: 'Calling, bots and audits cover stores and online together.' },
    ],
  },
  {
    slug: 'fmcg',
    name: 'FMCG',
    kicker: 'Nimantran for FMCG',
    title: 'Know your distributors and retailers better, without a bigger field team.',
    lead: 'FMCG brands depend on distributor and retailer relationships and on consumer feedback. Nimantran makes routine outreach and checking easier to scale.',
    uses: [
      { product: 'voice', title: 'Distributor and retailer order calls', text: 'Automated order reminders and stock check-ins in the local language.' },
      { product: 'voice', title: 'Consumer feedback and surveys', text: 'Collect short voice feedback after a campaign or a product launch.' },
      { product: 'audit', title: 'Field sales-call quality', text: 'Review tele-sales and consumer-care calls for consistency.' },
    ],
    advantages: [
      { title: 'Wider coverage', text: 'Reach more outlets than a field team can visit.' },
      { title: 'Voice of the consumer', text: 'Quick feedback loops after launches.' },
      { title: 'Consistent message', text: 'Every outlet hears the same offer, in its language.' },
      { title: 'Quality at scale', text: 'Tele-sales and care calls checked end to end.' },
      { title: 'Competitive awareness', text: 'See where the market is talking.' },
    ],
  },
  {
    slug: 'automobiles',
    name: 'Automobiles',
    kicker: 'Nimantran for Automobiles',
    title: 'Turn showroom enquiries into test drives, deliveries and happy owners.',
    lead: 'Car and two-wheeler dealers lose enquiries to slow follow-up and lose loyalty to silence after the sale. Nimantran qualifies leads, chases test drives, collects feedback and measures satisfaction, then shows how every conversation was handled.',
    uses: [
      { product: 'voice', title: 'Lead qualification', text: 'A voice bot calls new enquiries within minutes, asks budget, model, fuel type and buying timeline, and passes only serious buyers to your sales team.' },
      { product: 'audit', title: 'Sales-pitch review with perceived CSAT', text: 'Check that the right offers and finance options were explained, and see the estimated satisfaction of each customer conversation.' },
      { product: 'telephony', title: 'Sales-team lines', text: 'Give each advisor a mobile-style number customers recognise.' },
    ],
    advantages: [
      { title: 'Faster response', text: 'Every enquiry gets a prompt call, day or night.' },
      { title: 'Only serious leads reach advisors', text: 'Qualification happens before a salesperson spends time.' },
      { title: 'Every test drive followed up', text: 'Before and after, with no lead left to go cold.' },
      { title: 'Feedback you can act on', text: 'Test-drive and CSAT/NPS feedback in a structured form.' },
      { title: 'Better lead handling', text: 'See which advisors convert and why.' },
      { title: 'Simple to start', text: 'One dealership first, then scale.' },
    ],
  },
  {
    slug: 'ev',
    name: 'EV',
    kicker: 'Nimantran for EV',
    title: 'Guide first-time EV buyers from curiosity to test drive to delivery.',
    lead: 'EV buyers ask more questions, take longer to decide and need reassurance on range, charging and cost. Nimantran qualifies leads, follows up on test drives, collects feedback and keeps owners satisfied after they buy.',
    uses: [
      { product: 'voice', title: 'Lead qualification', text: 'Ask budget, charging access at home, daily running and buying timeline, then pass only qualified buyers to your team.' },
      { product: 'voice', title: 'Test-drive follow-ups', text: 'Confirm and remind test-drive bookings, and follow up with people who have not yet taken one.' },
      { product: 'audit', title: 'Support and sales call quality', text: 'Check accuracy on range, charging and warranty answers, with an estimated satisfaction score for each call.' },
    ],
    advantages: [
      { title: 'Faster response', text: 'Every enquiry gets a prompt call, day or night.' },
      { title: 'Only serious leads reach advisors', text: 'Qualification happens before a salesperson spends time.' },
      { title: 'Every test drive followed up', text: 'Before and after, so interested buyers do not drift away.' },
      { title: 'Feedback you can act on', text: 'Test-drive and CSAT/NPS feedback in a structured form.' },
      { title: 'Accurate answers', text: 'Audits show where agents struggle with technical questions.' },
      { title: 'Language fit', text: 'Reach owners in their language.' },
    ],
  },
  {
    slug: 'telecom',
    name: 'Telecom',
    kicker: 'Nimantran for Telecom',
    title: 'Handle huge call volumes with consistent quality.',
    lead: 'Telecom operators and service providers run some of the biggest contact centres in the country. Nimantran brings automation and audit coverage to the routine and the sensitive calls alike.',
    uses: [
      { product: 'voice', title: 'Bill, plan and recharge reminders', text: 'Automated reminders and plan-upgrade conversations at scale.' },
      { product: 'audit', title: 'Retention and churn call review', text: 'Score retention calls to learn what keeps customers.' },
      { product: 'sip', title: 'High-capacity voice lines', text: 'Concurrent-call capacity sized to campaign peaks.' },
    ],
    advantages: [
      { title: 'Scale without strain', text: 'Capacity and automation sized to your volume.' },
      { title: 'Retention insight', text: 'Learn what works on save calls.' },
      { title: 'Consistent service', text: 'Quality measured on every call.' },
      { title: 'Early outage signals', text: 'Public sentiment adds a second view.' },
      { title: 'Cost control', text: 'Per-minute bots reduce cost on routine calls.' },
    ],
  },
  {
    slug: 'logistics',
    name: 'Logistics',
    kicker: 'Nimantran for Logistics',
    title: 'Tell customers and drivers where things stand, before they have to ask.',
    lead: 'Logistics runs on updates. Where is it, when will it come, did it arrive. Nimantran automates the calls that answer those questions and checks the calls that handle exceptions.',
    uses: [
      { product: 'voice', title: 'Delivery slot and status calls', text: 'Confirm slots, reschedule and notify on delay.' },
      { product: 'sip', title: 'Capacity for peak seasons', text: 'Add channels around peak shipping periods.' },
      { product: 'audit', title: 'Exception-call quality', text: 'Review how failed deliveries and complaints are handled.' },
    ],
    advantages: [
      { title: 'Fewer "where is my order" calls', text: 'Proactive updates reduce inbound volume.' },
      { title: 'Fewer failed deliveries', text: 'Confirm availability before dispatch.' },
      { title: 'Peak-season flexibility', text: 'Scale channels up and back.' },
      { title: 'Consistent exception handling', text: 'Audit the calls that matter most.' },
      { title: 'Local language updates', text: 'Customers and drivers hear their language.' },
    ],
  },
  {
    slug: 'aviation',
    name: 'Aviation',
    kicker: 'Nimantran for Aviation',
    title: 'Keep passengers informed when plans change.',
    lead: 'Airlines, airports and travel providers need to reach large groups of people quickly when schedules shift, and to keep call centres calm during disruption.',
    uses: [
      { product: 'voice', title: 'Flight change and disruption alerts', text: 'Call affected passengers with new timings and options.' },
      { product: 'sip', title: 'Surge capacity', text: 'Add lines quickly during disruption or sale periods.' },
      { product: 'audit', title: 'Customer-care quality', text: 'Score handling of complaints and refund calls.' },
    ],
    advantages: [
      { title: 'Fast outreach', text: 'Reach thousands of passengers quickly.' },
      { title: 'Calmer call centres', text: 'Fewer inbound calls when you call first.' },
      { title: 'Surge-ready lines', text: 'Capacity that follows your peak.' },
      { title: 'Consistent handling', text: 'Audit refund and complaint calls.' },
      { title: 'Multilingual reach', text: 'English, Hindi and Hinglish.' },
    ],
  },
];

export const getIndustryBySlug = (slug) => INDUSTRIES.find((i) => i.slug === slug);

/** Two-letter decorative monogram per industry, used by the hub/detail page art tiles. */
export const INDUSTRY_LETTERS = {
  insurance: 'IN',
  banking: 'BK',
  health: 'HL',
  'retail-ecommerce': 'RE',
  fmcg: 'FM',
  automobiles: 'AU',
  ev: 'EV',
  telecom: 'TL',
  logistics: 'LG',
  aviation: 'AV',
};
