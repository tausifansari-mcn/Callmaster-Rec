import { AuditError } from './errors.js';
import { MAGIC_STAGES, TAGS } from './rubrics.js';

const API = 'https://api.anthropic.com/v1/messages';
const MAX_TRANSCRIPT_CHARS = 70000;

const fmtTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

/** "[00:12] Speaker 0: text" per turn — the exact labels the model must refer to in speakerRoles. */
export function formatTranscript(turns) {
  const text = turns.map((t) => `[${fmtTime(t.start)}] Speaker ${t.speaker}: ${t.text}`).join('\n');
  return text.length > MAX_TRANSCRIPT_CHARS ? `${text.slice(0, MAX_TRANSCRIPT_CHARS)}\n[…transcript truncated…]` : text;
}

// ---------------------------------------------------------------- tool schema
const str = (description) => ({ type: 'string', description });
const int = (description, min, max) => ({ type: 'integer', description, minimum: min, maximum: max });
const enumOf = (values, description) => ({ type: 'string', enum: values, ...(description ? { description } : {}) });
const SENTIMENT = ['positive', 'neutral', 'negative'];
const RISK = ['low', 'medium', 'high'];

const EXTRA_SCHEMAS = {
  clap: {
    clap: {
      type: 'object',
      description: 'CLAP root-cause attribution for this contact. The four integers must sum to 100.',
      properties: {
        customer: int('% of the root cause attributable to the customer (misunderstanding, wrong expectation, own error)', 0, 100),
        logistics: int('% attributable to logistics & operations (delivery, warehouse, back-office, process)', 0, 100),
        agent: int('% attributable to the agent on this call (handling, knowledge, attitude)', 0, 100),
        product: int('% attributable to the product/service itself (defect, design, pricing, policy)', 0, 100),
        rootCause: str('One or two sentences naming the real root cause of this contact'),
      },
      required: ['customer', 'logistics', 'agent', 'product', 'rootCause'],
    },
  },
  magic: {
    magic: {
      type: 'object',
      description: 'MAGIC Script CRT/CST read of this single call.',
      properties: {
        stages: {
          type: 'array',
          description: 'Exactly six entries, in order: opening, context, offer, objection, rebuttal, outcome.',
          items: {
            type: 'object',
            properties: {
              stage: enumOf(MAGIC_STAGES),
              reached: { type: 'boolean', description: 'Did the call reach this stage?' },
              quality: int('Quality of execution 0-10 (0 if not reached)', 0, 10),
              note: str('One sentence on what happened at this stage'),
            },
            required: ['stage', 'reached', 'quality', 'note'],
          },
        },
        dropOffStage: enumOf([...MAGIC_STAGES, 'none'], 'Stage where the call died or nearly died (CRT). "none" if it closed successfully.'),
        crtRead: str('CRT — where and why this call was rejected or nearly rejected (or "N/A – call succeeded")'),
        cstRead: str('CST — how the call moved from stage to stage toward the close'),
        winningMoment: str('The single strongest technique/phrase the agent used, quoted if possible'),
        suggestedRebuttal: str('The exact talk-track that would likely improve the outcome at the weakest stage'),
        outcome: enumOf(['converted', 'follow_up', 'rejected', 'unclear']),
        recommendation: str('One concrete recommendation to push to the floor for this call type'),
        retention: {
          type: 'object',
          description: 'Only for Retention calls; omit for sales calls.',
          properties: {
            reason: str('Customer stated reason for leaving'),
            offerMade: str('The save offer made, or "none"'),
            saveOutcome: enumOf(['saved', 'partially_saved', 'lost', 'unclear']),
            churnRiskAfterCall: enumOf(RISK),
          },
          required: ['reason', 'offerMade', 'saveOutcome', 'churnRiskAfterCall'],
        },
      },
      required: ['stages', 'dropOffStage', 'crtRead', 'cstRead', 'winningMoment', 'suggestedRebuttal', 'outcome', 'recommendation'],
    },
  },
  reso: {
    reso: {
      type: 'object',
      description: 'RESO promise-to-pay read of this collections call.',
      properties: {
        ptpCaptured: { type: 'boolean', description: 'Was any promise-to-pay obtained?' },
        amount: str('Promised amount as stated, or "not stated"'),
        date: str('Promised date as stated, or "not stated"'),
        mode: str('Promised payment mode (UPI, card, cash, bank transfer…) or "not stated"'),
        confidence: int('Likelihood 0-100 that this promise converts to an actual payment', 0, 100),
        genuine: { type: 'boolean', description: 'true if the promise looks genuine (confidence >= 65)' },
        reasoning: str('Why you rated the confidence this way, citing what the customer said'),
        nonPaymentReason: str('Why the payment is overdue, per the customer'),
        disputeRaised: { type: 'boolean' },
        riskSignals: { type: 'array', items: { type: 'string' }, description: 'Signals that the promise may break (max 4)' },
        recommendation: str('What the follow-up should be and when (e.g. call again before the promised date?)'),
      },
      required: ['ptpCaptured', 'amount', 'date', 'mode', 'confidence', 'genuine', 'reasoning', 'nonPaymentReason', 'disputeRaised', 'riskSignals', 'recommendation'],
    },
  },
};

export function buildToolSchema(rubric) {
  const extra = EXTRA_SCHEMAS[rubric.extra];
  const properties = {
    speakerRoles: {
      type: 'object',
      description: 'Which diarised speaker is the company agent and which is the customer/prospect.',
      properties: { agent: int('Speaker number of the agent', 0, 9), customer: int('Speaker number of the customer', 0, 9) },
      required: ['agent', 'customer'],
    },
    fit: {
      type: 'object',
      description: `Does this recording actually look like a "${rubric.lob}" call?`,
      properties: { matchesLob: { type: 'boolean' }, note: str('If it does not match, say what kind of call it appears to be; otherwise a short confirmation') },
      required: ['matchesLob', 'note'],
    },
    summary: str('2–3 sentence executive summary of the call and how it was handled'),
    callReason: str('Why the customer/prospect was on the call, in a few words'),
    outcome: str('The concrete outcome of the call, in one short sentence'),
    resolution: enumOf(['resolved', 'partially_resolved', 'unresolved', 'not_applicable'], 'Was the customer\'s need met by the end of the call?'),
    sentiment: {
      type: 'object',
      properties: { customerStart: enumOf(SENTIMENT), customerEnd: enumOf(SENTIMENT), agentTone: enumOf(['excellent', 'good', 'neutral', 'poor']) },
      required: ['customerStart', 'customerEnd', 'agentTone'],
    },
    csat: int('Perceived customer satisfaction with this interaction, 1 (very unhappy) to 5 (delighted)', 1, 5),
    likelihoodToRecommend: int('Perceived likelihood the customer would recommend the company after this call, 0-10', 0, 10),
    parameters: {
      type: 'array',
      description: `One entry for EVERY parameter in the rubric (${rubric.parameters.map((x) => x.key).join(', ')}).`,
      items: {
        type: 'object',
        properties: {
          key: enumOf(rubric.parameters.map((x) => x.key)),
          applicable: { type: 'boolean', description: 'false only if the parameter genuinely could not arise on this call (e.g. no hold occurred)' },
          score: int('0 (absent/harmful) to 10 (exemplary). 5 = acceptable but unremarkable.', 0, 10),
          verdict: str('One sentence judging this parameter, specific to this call'),
          evidence: str('A short verbatim quote (with [mm:ss]) from the transcript that supports the score, or empty'),
          improvement: str('A specific, actionable coaching point; empty if the score is 9-10'),
        },
        required: ['key', 'applicable', 'score', 'verdict', 'evidence', 'improvement'],
      },
    },
    strengths: { type: 'array', items: { type: 'string' }, description: '2–5 things the agent did well, specific to this call' },
    improvements: {
      type: 'array',
      description: '2–6 prioritised areas to improve, most important first',
      items: {
        type: 'object',
        properties: { tag: enumOf(TAGS), priority: enumOf(['high', 'medium', 'low']), text: str('What went wrong and what to do instead, specific to this call') },
        required: ['tag', 'priority', 'text'],
      },
    },
    coaching: { type: 'array', items: { type: 'string' }, description: 'Top 3 coaching actions for the QA lead / team leader' },
    compliance: {
      type: 'array',
      description: 'One entry per compliance check listed for this LOB.',
      items: {
        type: 'object',
        properties: { check: str('The check, copied from the list'), status: enumOf(['pass', 'fail', 'na']), note: str('Brief evidence or explanation') },
        required: ['check', 'status', 'note'],
      },
    },
    keyMoments: {
      type: 'array',
      description: 'Up to 6 pivotal moments in chronological order',
      items: {
        type: 'object',
        properties: { at: str('Timestamp mm:ss from the transcript'), type: enumOf(['positive', 'negative', 'neutral']), label: str('What happened, in under 15 words') },
        required: ['at', 'type', 'label'],
      },
    },
    risks: {
      type: 'object',
      properties: { escalation: enumOf(RISK), socialMedia: enumOf(RISK), note: str('Why, in one short sentence (or "none")') },
      required: ['escalation', 'socialMedia', 'note'],
    },
    ...extra,
  };
  return {
    name: 'submit_audit',
    description: 'Submit the completed quality audit of the call.',
    input_schema: { type: 'object', properties, required: Object.keys(properties) },
  };
}

// ---------------------------------------------------------------- prompt
export function buildSystemPrompt(rubric) {
  const params = rubric.parameters
    .map((x) => `- ${x.key} — ${x.name} (weight ${x.weight}): ${x.guide}`)
    .join('\n');
  const checks = rubric.compliance.map((c) => `- ${c}`).join('\n');
  return `You are a senior contact-centre quality auditor with 20 years of floor experience, auditing one call for CallMaster's "Deep Customer Insights".

CALL TYPE: ${rubric.lob} — ${rubric.description}
FRAMEWORK: ${rubric.framework}

Audit ONLY from the transcript you are given. Be rigorous, fair and specific:
- The transcript is machine-generated with speaker labels ("Speaker 0", "Speaker 1"); it may mix English, Hindi and Hinglish, and may contain recognition errors. Judge intent, not typos. Write all of YOUR output in clear English; when quoting the call, quote the original words.
- First work out which speaker is the company agent and which is the customer/prospect, and report it in speakerRoles.
- Score every rubric parameter from 0 to 10 (5 = acceptable but unremarkable; reserve 9-10 for exemplary; 0-2 for absent or harmful behaviour). Do not inflate. Base each score on evidence, and quote it (with the [mm:ss] timestamp) in "evidence".
- Never invent facts, numbers, benchmarks or events that are not in the transcript. If something did not happen, say so.
- Coaching points must be concrete and specific to this call ("say X instead of Y"), never generic advice.
- If the recording does not look like a ${rubric.lob} call, still audit it against this rubric, set fit.matchesLob=false and explain.
- Do not compute an overall score; the system computes it from your parameter scores.

RUBRIC PARAMETERS (score every one; use applicable=false only if the parameter truly could not arise):
${params}

COMPLIANCE CHECKS (report each as pass / fail / na):
${checks}

FRAMEWORK GUIDANCE:
${rubric.focus}

Return your audit by calling the submit_audit tool exactly once.`;
}

// ---------------------------------------------------------------- API call
async function post(cfg, body) {
  return fetch(API, {
    method: 'POST',
    headers: { 'x-api-key': cfg.anthropicKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(240000),
  });
}

/** Returns the raw submit_audit tool input. Retries once on overload / rate limits. */
export async function auditTranscript({ rubric, turns, meta, cfg }) {
  const tool = buildToolSchema(rubric);
  const userText = `Call metadata: duration ${fmtTime(meta.durationSec)}; detected languages: ${meta.languages.join(', ') || 'unknown'}; selected line of business: ${rubric.lob}.\n\nTRANSCRIPT\n${formatTranscript(turns)}`;
  const base = {
    model: cfg.anthropicModel,
    max_tokens: 9000,
    system: buildSystemPrompt(rubric),
    tools: [tool],
    messages: [{ role: 'user', content: userText }],
  };

  let res;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      res = await post(cfg, { ...base, tool_choice: { type: 'tool', name: tool.name } });
      // Some models don't accept a forced tool choice — let them choose (the prompt tells them to call the tool).
      if (res.status === 400) {
        const peek = await res.clone().text();
        if (/tool_choice/i.test(peek)) res = await post(cfg, { ...base, tool_choice: { type: 'auto' } });
      }
    } catch (err) {
      if (attempt === 1) throw new AuditError('CLAUDE_NETWORK', `Anthropic request failed: ${err.message}`, 'The audit service did not respond in time. Please try again.');
      continue;
    }
    if ((res.status === 429 || res.status >= 500) && attempt === 0) {
      await new Promise((r) => setTimeout(r, 4000));
      continue;
    }
    break;
  }

  if (!res.ok) {
    const detail = (await res.text().catch(() => '')).slice(0, 400);
    throw new AuditError(`CLAUDE_${res.status}`, `Anthropic responded ${res.status}: ${detail}`);
  }
  const body = await res.json();
  const block = (body.content || []).find((c) => c.type === 'tool_use' && c.name === tool.name);
  if (!block) throw new AuditError('CLAUDE_NO_TOOL', `Model did not return the audit (stop_reason=${body.stop_reason})`);
  if (body.stop_reason === 'max_tokens') throw new AuditError('CLAUDE_TRUNCATED', 'Audit output was truncated (max_tokens)');
  return { audit: block.input, usage: body.usage, model: body.model };
}
