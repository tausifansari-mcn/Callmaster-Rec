/**
 * Content for the Insights hub (/insights) and article pages (/insights/:slug).
 * Each article: { slug, category, title, readTime, teaser, intro, sections, takeaway }
 * - intro: lead paragraph shown under the title, no heading.
 * - sections: [{ heading, body }], body: array of
 *     { type: 'p', text } | { type: 'ul' | 'ol', items: [{ bold, text }] }
 *   `bold` is the lead-in phrase to render in <b>; it may be null for plain list items.
 * - takeaway: plain text rendered inside the closing highlighted callout.
 */

export const INSIGHTS = [
  {
    slug: 'call-audit-coverage',
    category: 'Quality',
    title: 'Auditing 2% of calls means guessing about the other 98%',
    readTime: '5 min read',
    teaser: 'Sampling made sense when a human had to listen to every recording. It no longer does. Here is what full-coverage auditing changes for a contact centre.',
    intro: 'Most contact centres audit a small sample of calls, often a couple of percent. The reason is practical: a quality analyst can only listen to so many recordings in a day. But the sample was never the goal. The goal is to know how every customer was treated.',
    sections: [
      {
        heading: 'What a small sample hides',
        body: [
          {
            type: 'ul',
            items: [
              { bold: 'Rare but costly events.', text: ' A mis-sold product, a missed disclosure or an abusive exchange may happen on one call in a few hundred. A sample can easily miss it.' },
              { bold: 'Agent-level patterns.', text: ' With only a handful of audited calls per agent each month, one good or bad call swings the score.' },
              { bold: 'Process gaps.', text: ' If a script breaks at a particular step, you see it only when enough calls reach that step.' },
            ],
          },
        ],
      },
      {
        heading: 'What changes with full coverage',
        body: [
          { type: 'p', text: 'When every call is transcribed and scored against the same parameters, the audit stops being a lottery. Analysts spend time on the calls that need a human: the lowest scores, the compliance flags and the escalations. Coaching conversations start from evidence across dozens of calls, not from one memorable recording.' },
        ],
      },
      {
        heading: 'How to start without disrupting the floor',
        body: [
          {
            type: 'ol',
            items: [
              { bold: null, text: 'Pick the five to eight parameters you already score today: greeting, probing, resolution, tone, compliance.' },
              { bold: null, text: "Run the same recordings through automated scoring and compare with your analysts' scores. Expect differences and use them to tune the parameters." },
              { bold: null, text: 'Move analysts from random listening to reviewing exceptions.' },
              { bold: null, text: 'Report coverage as a number: the share of calls audited, next to the quality score.' },
            ],
          },
        ],
      },
    ],
    takeaway: 'a quality score is only as trustworthy as the share of calls behind it. Report both.',
  },
  {
    slug: 'voice-bots-vs-ivr',
    category: 'Voice Bots',
    title: 'Voice bots vs IVR: where AI voice earns its place',
    readTime: '5 min read',
    teaser: 'IVR menus ask customers to adapt to the system. Voice bots adapt to the customer. A practical look at where each one fits.',
    intro: 'Press 1 for billing, press 2 for support, press 3 to hear the options again. Anyone who has called a large company knows the pattern. A menu-based IVR works when choices are few and fixed. It struggles when customers describe a problem in their own words, in their own language.',
    sections: [
      {
        heading: 'Where voice bots fit best',
        body: [
          {
            type: 'ul',
            items: [
              { bold: 'Outbound reminders and confirmations', text: ' such as payment due dates, appointment confirmations and delivery updates.' },
              { bold: 'Lead qualification', text: ' with a few simple questions before a salesperson calls back.' },
              { bold: 'First-level inbound queries', text: ' like order status or branch timings, where the answer already exists in a system.' },
              { bold: 'Surveys', text: ' after a service interaction, where a short spoken answer beats an ignored link.' },
            ],
          },
        ],
      },
      {
        heading: 'Where people should stay in the loop',
        body: [
          { type: 'p', text: 'Complaints from upset customers, negotiations, and anything with legal or financial consequences deserve a human. A good bot recognises the limit and hands over with the context it has gathered, so the customer does not repeat themselves.' },
        ],
      },
      {
        heading: 'Questions to ask before you pilot',
        body: [
          {
            type: 'ol',
            items: [
              { bold: null, text: 'Which languages and mixed-language speech (such as Hinglish) do your customers actually use?' },
              { bold: null, text: 'What happens when the bot is unsure? Is there a clean transfer to an agent?' },
              { bold: null, text: 'How will you measure success: completion rate, transfer rate, customer rating, cost per resolved call?' },
              { bold: null, text: 'Are calls disclosed as automated, and recorded in line with your consent policy?' },
            ],
          },
        ],
      },
    ],
    takeaway: 'start with one high-volume, low-emotion call type, measure it for a month, then expand.',
  },
  {
    slug: 'switch-cloud-telephony',
    category: 'Cloud Telephony',
    title: 'Seven questions to ask before you switch cloud telephony providers',
    readTime: '6 min read',
    teaser: 'Per-seat price is only one line of the bill. Use this checklist to compare providers on what actually affects your operation.',
    intro: 'Comparing cloud telephony quotes by the per-user price alone is the quickest way to be surprised later. Use these seven questions to compare like with like.',
    sections: [
      {
        heading: 'The checklist',
        body: [
          {
            type: 'ol',
            items: [
              { bold: 'What exactly is included in the licence?', text: ' Recording, reports, CRM integration and support hours are sometimes separate line items.' },
              { bold: 'How are channels and numbers priced as you grow?', text: ' Ask for the rate to add ten more of each.' },
              { bold: 'Can you keep your existing numbers?', text: ' Ask about porting steps and timelines.' },
              { bold: 'What number do customers see?', text: ' A number that looks like a mobile number often gets answered more readily than an unfamiliar landline-style one.' },
              { bold: 'What is the uptime commitment, and what happens when it is missed?', text: ' Ask to see it in writing.' },
              { bold: 'Where is call data stored and for how long?', text: ' This matters for your own compliance obligations.' },
              { bold: 'How easy is it to leave?', text: ' Notice periods, data export and minimum terms all count.' },
            ],
          },
        ],
      },
      {
        heading: 'Run a pilot, not just a demo',
        body: [
          { type: 'p', text: 'Put a small team on the new system for two weeks, on real calls. Track connect rate, call quality complaints and the time agents spend on set-up tasks.' },
        ],
      },
    ],
    takeaway: 'if a provider will not put the total monthly cost for your expected seats, channels and numbers in one quote, keep looking.',
  },
  {
    slug: 'conversation-data-revenue',
    category: 'Revenue',
    title: 'Five signals in your sales calls that predict revenue',
    readTime: '5 min read',
    teaser: 'Your recordings already contain what customers want, what stops them and what competitors they mention. Here is what to listen for.',
    intro: 'Every sales call is a small research interview that most companies never read. When calls are transcribed and searchable, patterns appear that no dashboard of call counts can show.',
    sections: [
      {
        heading: 'Five signals worth tracking',
        body: [
          {
            type: 'ol',
            items: [
              { bold: 'Objections by frequency.', text: ' If price comes up on most lost calls, that is a positioning problem more than a negotiation problem.' },
              { bold: 'Competitor mentions.', text: ' Which names come up, and in what context?' },
              { bold: 'Questions the agent could not answer.', text: ' Each one is a training or content gap.' },
              { bold: 'Talk-to-listen balance.', text: ' Calls where the customer does most of the talking at the discovery stage tend to progress better. Test this on your own data before you rely on it.' },
              { bold: 'Commitments made.', text: ' Callbacks promised and not logged are lost revenue.' },
            ],
          },
        ],
      },
      {
        heading: 'Turning signals into action',
        body: [
          { type: 'p', text: 'Review the top three objections monthly with sales and marketing together. Update the script, the website and the follow-up message in the same week, so the fix reaches customers quickly.' },
        ],
      },
    ],
    takeaway: 'choose one signal, review it every month and change one thing as a result. Insight without a change is just reporting.',
  },
  {
    slug: 'outbound-calling-compliance',
    category: 'Compliance',
    title: 'Outbound calling and SMS in India: a compliance primer',
    readTime: '6 min read',
    teaser: 'Registration, templates, consent and number series: the practical basics every business should have in order before it dials or texts at scale.',
    intro: 'Businesses that call or message customers in India work within rules set by the telecom regulator, TRAI, and enforced through telecom operators. This primer summarises the basics in plain language. It is general information, not legal advice, and the rules are updated from time to time, so confirm current requirements with your telecom provider or adviser.',
    sections: [
      {
        heading: '1. Register before you send',
        body: [
          { type: 'p', text: "Commercial SMS is sent through a registered entity on the operators' DLT platform, with approved sender headers and pre-approved message templates. A message that does not match an approved template can be blocked." },
        ],
      },
      {
        heading: '2. Match the message type to the purpose',
        body: [
          { type: 'p', text: 'Operators distinguish between transactional, service and promotional messages and calls. A one-time password or payment alert is treated differently from an offer. Keep the purposes separate, and do not slip promotional content into a transactional template.' },
        ],
      },
      {
        heading: '3. Respect consent and preferences',
        body: [
          {
            type: 'ul',
            items: [
              { bold: null, text: 'Record when and how each customer gave consent.' },
              { bold: null, text: 'Check customer preference registers before promotional outreach.' },
              { bold: null, text: 'Make opting out easy, and honour it promptly.' },
            ],
          },
        ],
      },
      {
        heading: '4. Use the right number series',
        body: [
          { type: 'p', text: 'Regulators have directed that certain kinds of calls use dedicated number series, and that promotional calling should not come from ordinary ten-digit mobile numbers. Ask your provider which series applies to your use case.' },
        ],
      },
      {
        heading: '5. Keep records',
        body: [
          { type: 'p', text: 'Keep call logs, consent records and template approvals. If a customer complains, you will want to answer with evidence.' },
        ],
      },
    ],
    takeaway: 'treat compliance as part of the set-up, not a clean-up. It is cheaper to get headers, templates and consent right on day one.',
  },
];

export const getInsightBySlug = (slug) => INSIGHTS.find((a) => a.slug === slug);
