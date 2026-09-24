/**
 * Audit rubrics — one per line of business (LOB). The rubric decides WHAT Claude checks for that kind of call,
 * how much each parameter weighs, and which framework-specific read (CLAP / MAGIC Script CRT-CST / RESO) is produced.
 * Weights in each rubric sum to 100. The overall score is computed from the parameter scores in code (see scoring.js),
 * never by the model, so it is always consistent with the scorecard shown to the user.
 */

export const LOBS = ['Inbound Support', 'Outbound Sales', 'Collections', 'Retention'];

export const FRAMEWORK_BY_LOB = {
  'Inbound Support': 'CLAP',
  'Outbound Sales': 'MAGIC Script — CRT / CST',
  Collections: 'RESO',
  Retention: 'MAGIC Script — CRT / CST',
};

export const TAGS = ['TONE', 'EMPATHY', 'COMPLIANCE', 'RESOLUTION', 'PRODUCT', 'PROCESS', 'DISCOVERY', 'OBJECTION', 'NEGOTIATION', 'CLOSING', 'OTHER'];

export const MAGIC_STAGES = ['opening', 'context', 'offer', 'objection', 'rebuttal', 'outcome'];

const p = (key, name, weight, guide) => ({ key, name, weight, guide });

export const RUBRICS = {
  'Inbound Support': {
    lob: 'Inbound Support',
    framework: 'CLAP',
    extra: 'clap',
    description: 'An inbound customer-service call: a customer contacts the company with a question, problem or request.',
    parameters: [
      p('greeting', 'Greeting & call opening', 8, 'Brand and agent name stated, warm and clear opening, invites the customer to explain.'),
      p('listening', 'Active listening & understanding', 12, 'Lets the customer finish, does not interrupt, paraphrases/clarifies, correctly identifies the real issue without making the customer repeat themselves.'),
      p('empathy', 'Empathy & tone', 12, 'Acknowledges feelings genuinely (not scripted), calm and courteous throughout, de-escalates frustration, no defensiveness.'),
      p('knowledge', 'Accuracy & product knowledge', 14, 'Information given is correct and complete, confident without guessing, uses the right process/policy.'),
      p('resolution', 'Resolution & ownership', 16, 'Solves the issue on this call or commits to a concrete next step with an owner and timeline; takes ownership instead of passing the buck.'),
      p('clarity', 'Communication clarity', 8, 'Plain language, structured explanation, good pace, no jargon, checks understanding.'),
      p('control', 'Call control, hold & dead air', 6, 'Sets expectations before holds, keeps holds short, avoids long silences, keeps the call on track.'),
      p('process', 'Process & policy adherence', 5, 'Follows the expected handling steps (verify, diagnose, resolve, log), stays within policy.'),
      p('compliance', 'Compliance & verification', 12, 'Verifies identity before sharing account data, makes required disclosures, no unauthorised promises, no abusive or inappropriate language.'),
      p('closing', 'Closing & confirmation', 7, 'Recaps the outcome/next steps, confirms the customer is satisfied, asks if anything else is needed, professional sign-off.'),
    ],
    compliance: [
      'Greeting with company name and agent name',
      'Customer identity verified before discussing account/order data',
      'No promises outside policy (refunds, timelines, compensation)',
      'Professional language throughout — no rudeness or blame',
      'Outcome and next steps confirmed before closing',
    ],
    focus: `CLAP separates WHO/WHAT caused the problem: Customer, Logistics & operations, Agent, Product. Most contact-centre QA blames the agent because
they are the only employee on the recording — do not do that. Decide, from the evidence in the call, how the root cause of this contact splits
across C / L / A / P (integers summing to 100) and explain it. Also assess escalation risk and social-media / reputation risk.`,
  },

  'Outbound Sales': {
    lob: 'Outbound Sales',
    framework: 'MAGIC Script — CRT / CST',
    extra: 'magic',
    description: 'An outbound sales call: the agent calls a prospect to sell a product/service or book a next step.',
    parameters: [
      p('opening', 'Opening & rapport', 10, 'Introduces self and company, states the reason for the call, asks permission / checks it is a good time, earns attention in the first 20 seconds.'),
      p('discovery', 'Discovery & need identification', 14, 'Asks relevant open questions, uncovers need/pain/budget/decision-maker, listens before pitching.'),
      p('offer', 'Offer & value proposition', 16, 'Clear, concise, tailored to what the prospect said; benefits over features; price/terms explained accurately.'),
      p('objection', 'Objection handling', 16, 'Recognises objections (explicit and implicit), acknowledges them, probes the real concern instead of arguing.'),
      p('rebuttal', 'Rebuttal quality', 12, 'Rebuttal is relevant, evidence-based, concise and moves the conversation forward; does not repeat the pitch verbatim.'),
      p('persuasion', 'Persuasion & momentum', 8, 'Confident, conversational, builds urgency honestly (no false scarcity), keeps control of the flow.'),
      p('closing', 'Closing & call to action', 14, 'Asks clearly for the sale/next step, proposes a specific time/action, confirms details, handles hesitation at the close.'),
      p('compliance', 'Compliance & honesty', 10, 'No misleading or exaggerated claims, respects "not interested"/do-not-call requests, discloses terms, obtains consent for follow-up.'),
    ],
    compliance: [
      'Agent and company identified at the start',
      'Permission / suitable time checked before pitching',
      'No misleading claims or false urgency',
      'Price, terms and conditions disclosed accurately',
      'A clear "not interested" / do-not-call request was respected',
    ],
    focus: `MAGIC Script tracks the call as a skeleton: opening → context → offer → objection → rebuttal → outcome.
CRT (Call Rejection Trajectory) = where this call died or nearly died. CST (Call Success Trajectory) = how the call moved stage to stage toward the close.
Grade each of the six stages for THIS call only (reached? quality 0-10, one-line note). Identify the drop-off stage (or "none" if the call closed).
Name the strongest technique the agent used and, if the call was lost or stalled, write the exact rebuttal / talk-track that would likely have worked better.
Do NOT invent portfolio statistics, conversion percentages or benchmarks — you only have this one call.`,
  },

  Collections: {
    lob: 'Collections',
    framework: 'RESO',
    extra: 'reso',
    description: 'A collections / credit-recovery call: the agent contacts a customer about an overdue payment and tries to secure repayment.',
    parameters: [
      p('opening', 'Opening & right-party verification', 10, 'Identifies self and company, confirms they are speaking to the right person before disclosing any debt details.'),
      p('compliance', 'Compliance & conduct', 20, 'No threats, harassment, shaming, false legal claims or disclosure to third parties; states consequences accurately; respects customer dignity and stated constraints.'),
      p('discovery', 'Reason for non-payment', 12, 'Asks why the payment is overdue, listens, identifies genuine hardship vs. unwillingness vs. dispute.'),
      p('negotiation', 'Negotiation & solution offering', 14, 'Offers workable options (part-payment, date change, restructuring where allowed), creates a sense of importance without pressure.'),
      p('ptp', 'Promise-to-Pay capture', 18, 'Secures a specific amount, date and payment mode; confirms it back; gets a firm, realistic commitment (not a vague "will try").'),
      p('empathy', 'Empathy & professionalism', 10, 'Firm but respectful tone, empathy for hardship, stays calm when the customer is upset.'),
      p('dispute', 'Objection & dispute handling', 8, 'Handles excuses/disputes correctly, logs and routes genuine disputes, does not argue.'),
      p('closing', 'Closing & recap', 8, 'Recaps the commitment (amount/date/mode), states the next contact, professional close.'),
    ],
    compliance: [
      'Right person confirmed before discussing the debt',
      'Agent, company and purpose of the call stated',
      'No threats, intimidation, shaming or abusive language',
      'No false or exaggerated legal/credit consequences',
      'No debt details disclosed to a third party',
      'Promise-to-pay details recapped and confirmed',
    ],
    focus: `RESO focuses on promises: a collections forecast is built on promise-to-pay (PTP) commitments, so what matters is which promises will actually convert.
Capture the PTP precisely (amount, date, mode) and rate its CONFIDENCE 0-100 from evidence in the call: specificity, customer's stated ability to pay, hesitation/hedging,
prior broken promises mentioned, a named payment source, and whether the customer repeated the commitment unprompted. Say whether it is likely genuine.
Also record the stated reason for non-payment, whether a dispute was raised, risk signals, and what tomorrow's follow-up should be.
Any service or sales issue surfacing inside the call should be reflected in the improvements list.`,
  },

  Retention: {
    lob: 'Retention',
    framework: 'MAGIC Script — CRT / CST',
    extra: 'magic',
    description: 'A retention / renewal / save call: the customer wants to cancel, downgrade or has not renewed, and the agent tries to keep them.',
    parameters: [
      p('opening', 'Opening & acknowledgement', 10, 'Warm opening, acknowledges the reason for the call, sets a collaborative tone.'),
      p('discovery', 'Discovering the reason for leaving', 16, 'Asks probing questions to find the real reason (price, service, competitor, need), confirms understanding.'),
      p('empathy', 'Empathy & de-escalation', 12, 'Acknowledges frustration without defensiveness, keeps the customer feeling heard.'),
      p('offer', 'Save offer relevance & value framing', 18, 'Offer matches the stated reason, is framed around value/benefit, is proportionate (not a reflexive discount).'),
      p('objection', 'Objection handling', 14, 'Addresses hesitations directly, uses proof/alternatives, does not stonewall a clear decision.'),
      p('knowledge', 'Plan / product knowledge', 10, 'Accurate on plans, pricing, terms, alternatives and consequences of cancelling.'),
      p('compliance', 'Compliance & honesty', 10, 'Honest about terms/charges, no misleading save claims, honours a clear cancellation request, verifies identity.'),
      p('closing', 'Closing & commitment', 10, 'Secures a clear outcome (saved / changed plan / cancelled cleanly), recaps next steps, professional close.'),
    ],
    compliance: [
      'Customer identity verified',
      'Cancellation terms and charges explained honestly',
      'Save offers not misleading or coercive',
      'A clear, repeated cancellation request was honoured',
      'Outcome and next steps confirmed',
    ],
    focus: `Treat this as a MAGIC Script call (opening → context → offer → objection → rebuttal → outcome) where the "offer" is the save offer and success means the customer stays.
Grade each of the six stages for THIS call only, identify the drop-off stage (or "none" if the customer was saved), name the strongest technique used and, if the save failed
or was weak, write the talk-track that would likely have worked. Also record the customer's stated reason for leaving, the save offer made, the save outcome and the churn risk after the call.
Do NOT invent portfolio statistics or benchmarks — you only have this one call.`,
  },
};

export const rubricFor = (lob) => RUBRICS[lob] || RUBRICS['Inbound Support'];
