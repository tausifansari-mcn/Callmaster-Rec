import { MAGIC_STAGES, TAGS } from './rubrics.js';

const clamp = (n, lo, hi, fallback = lo) => {
  const v = Number(n);
  return Number.isFinite(v) ? Math.min(hi, Math.max(lo, Math.round(v))) : fallback;
};
const oneOf = (v, list, fallback) => (list.includes(v) ? v : fallback);
const text = (v, max = 600) => String(v ?? '').trim().slice(0, max);
const list = (v, max, len = 400) => (Array.isArray(v) ? v.map((x) => text(x, len)).filter(Boolean).slice(0, max) : []);

export const bandFor = (score) => ({
  band: score >= 80 ? 'good' : score >= 65 ? 'mid' : 'low',
  bandLabel: score >= 80 ? 'Strong call' : score >= 65 ? 'Needs coaching' : 'Below standard',
});

/** Overall quality score, 0-100: weighted mean of the applicable parameter scores. Computed here, never by the model. */
export function overallScore(parameters) {
  const used = parameters.filter((p) => p.applicable);
  const weight = used.reduce((s, p) => s + p.weight, 0);
  if (!weight) return 0;
  return Math.round((used.reduce((s, p) => s + p.weight * (p.score / 10), 0) / weight) * 100);
}

/** Scales integers so they sum to exactly 100 (largest-remainder), tolerating model rounding slips. */
function normalisePercents(obj, keys) {
  const raw = keys.map((k) => Math.max(0, Number(obj?.[k]) || 0));
  const total = raw.reduce((a, b) => a + b, 0);
  if (!total) return Object.fromEntries(keys.map((k, i) => [k, i === 0 ? 100 : 0]));
  const scaled = raw.map((v) => (v / total) * 100);
  const floors = scaled.map(Math.floor);
  let rest = 100 - floors.reduce((a, b) => a + b, 0);
  scaled.map((v, i) => [v - floors[i], i]).sort((a, b) => b[0] - a[0]).forEach(([, i]) => { if (rest > 0) { floors[i] += 1; rest -= 1; } });
  return Object.fromEntries(keys.map((k, i) => [k, floors[i]]));
}

const ltrCategory = (n) => (n >= 9 ? 'promoter' : n >= 7 ? 'passive' : 'detractor');

function talkShare(turns, agentSpeaker) {
  let agent = 0;
  let customer = 0;
  for (const t of turns) {
    const d = Math.max(0, t.end - t.start);
    if (t.speaker === agentSpeaker) agent += d; else customer += d;
  }
  const total = agent + customer;
  return total ? { agentTalkPct: Math.round((agent / total) * 100), customerTalkPct: 100 - Math.round((agent / total) * 100) } : { agentTalkPct: 0, customerTalkPct: 0 };
}

/**
 * Turns the model's raw tool output into the stable, fully-validated report the API stores and the UI renders.
 * Defensive by design: anything missing or out of range is clamped or defaulted so a slightly malformed answer
 * can never crash the report.
 */
export function buildResults({ rubric, raw, turns, meta, model }) {
  const speakers = [...new Set(turns.map((t) => t.speaker))];
  const words = new Map();
  turns.forEach((t) => words.set(t.speaker, (words.get(t.speaker) || 0) + t.text.split(/\s+/).length));
  let agent = raw.speakerRoles?.agent;
  let customer = raw.speakerRoles?.customer;
  if (!speakers.includes(agent)) agent = speakers[0];
  if (!speakers.includes(customer) || customer === agent) customer = speakers.find((s) => s !== agent) ?? agent;

  const parameters = rubric.parameters.map((def) => {
    const got = (raw.parameters || []).find((x) => x.key === def.key);
    return {
      key: def.key,
      name: def.name,
      weight: def.weight,
      applicable: got ? got.applicable !== false : false,
      score: got ? clamp(got.score, 0, 10) : 0,
      verdict: text(got?.verdict, 400),
      evidence: text(got?.evidence, 400),
      improvement: text(got?.improvement, 500),
    };
  });

  const score = overallScore(parameters);
  const csat = clamp(raw.csat, 1, 5, 3);
  const ltr = clamp(raw.likelihoodToRecommend, 0, 10, 5);

  const results = {
    live: true,
    mock: false,
    lob: rubric.lob,
    framework: rubric.framework,
    score,
    ...bandFor(score),
    summary: text(raw.summary, 900),
    callReason: text(raw.callReason, 200),
    outcome: text(raw.outcome, 300),
    resolution: oneOf(raw.resolution, ['resolved', 'partially_resolved', 'unresolved', 'not_applicable'], 'not_applicable'),
    fit: { matchesLob: raw.fit?.matchesLob !== false, note: text(raw.fit?.note, 400) },
    call: {
      durationSec: meta.durationSec,
      languages: meta.languages,
      turns: turns.length,
      words: meta.wordCount,
      speakers: speakers.length,
      ...talkShare(turns, agent),
    },
    sentiment: {
      customerStart: oneOf(raw.sentiment?.customerStart, ['positive', 'neutral', 'negative'], 'neutral'),
      customerEnd: oneOf(raw.sentiment?.customerEnd, ['positive', 'neutral', 'negative'], 'neutral'),
      agentTone: oneOf(raw.sentiment?.agentTone, ['excellent', 'good', 'neutral', 'poor'], 'neutral'),
    },
    csat,
    csatPct: csat * 20,
    likelihoodToRecommend: ltr,
    nps: ltrCategory(ltr),
    parameters,
    strengths: list(raw.strengths, 5),
    improvements: (raw.improvements || []).slice(0, 6).map((i) => ({
      tag: oneOf(i.tag, TAGS, 'OTHER'),
      priority: oneOf(i.priority, ['high', 'medium', 'low'], 'medium'),
      text: text(i.text, 500),
    })).filter((i) => i.text),
    coaching: list(raw.coaching, 3, 500),
    compliance: rubric.compliance.map((check) => {
      const got = (raw.compliance || []).find((c) => text(c.check).toLowerCase() === check.toLowerCase())
        || (raw.compliance || []).find((c) => text(c.check).toLowerCase().includes(check.toLowerCase().slice(0, 25)));
      return { check, status: oneOf(got?.status, ['pass', 'fail', 'na'], 'na'), note: text(got?.note, 300) };
    }),
    keyMoments: (raw.keyMoments || []).slice(0, 6).map((m) => ({
      at: text(m.at, 8), type: oneOf(m.type, ['positive', 'negative', 'neutral'], 'neutral'), label: text(m.label, 160),
    })).filter((m) => m.label),
    risks: {
      escalation: oneOf(raw.risks?.escalation, ['low', 'medium', 'high'], 'low'),
      socialMedia: oneOf(raw.risks?.socialMedia, ['low', 'medium', 'high'], 'low'),
      note: text(raw.risks?.note, 300),
    },
    model,
  };

  if (rubric.extra === 'clap') {
    const c = raw.clap || {};
    results.clap = { ...normalisePercents(c, ['customer', 'logistics', 'agent', 'product']), rootCause: text(c.rootCause, 500) };
  }
  if (rubric.extra === 'magic') {
    const m = raw.magic || {};
    results.magic = {
      stages: MAGIC_STAGES.map((stage) => {
        const got = (m.stages || []).find((s) => s.stage === stage);
        return { stage, reached: Boolean(got?.reached), quality: got?.reached ? clamp(got.quality, 0, 10) : 0, note: text(got?.note, 300) };
      }),
      dropOffStage: oneOf(m.dropOffStage, [...MAGIC_STAGES, 'none'], 'none'),
      crtRead: text(m.crtRead, 500),
      cstRead: text(m.cstRead, 500),
      winningMoment: text(m.winningMoment, 500),
      suggestedRebuttal: text(m.suggestedRebuttal, 700),
      outcome: oneOf(m.outcome, ['converted', 'follow_up', 'rejected', 'unclear'], 'unclear'),
      recommendation: text(m.recommendation, 500),
    };
    if (rubric.lob === 'Retention' && m.retention) {
      results.magic.retention = {
        reason: text(m.retention.reason, 300),
        offerMade: text(m.retention.offerMade, 300),
        saveOutcome: oneOf(m.retention.saveOutcome, ['saved', 'partially_saved', 'lost', 'unclear'], 'unclear'),
        churnRiskAfterCall: oneOf(m.retention.churnRiskAfterCall, ['low', 'medium', 'high'], 'medium'),
      };
    }
  }
  if (rubric.extra === 'reso') {
    const r = raw.reso || {};
    const confidence = clamp(r.confidence, 0, 100, 50);
    results.reso = {
      ptpCaptured: Boolean(r.ptpCaptured),
      amount: text(r.amount, 80) || 'not stated',
      date: text(r.date, 80) || 'not stated',
      mode: text(r.mode, 80) || 'not stated',
      confidence,
      genuine: r.genuine === undefined ? confidence >= 65 : Boolean(r.genuine),
      reasoning: text(r.reasoning, 600),
      nonPaymentReason: text(r.nonPaymentReason, 300),
      disputeRaised: Boolean(r.disputeRaised),
      riskSignals: list(r.riskSignals, 4, 200),
      recommendation: text(r.recommendation, 500),
    };
  }

  const transcript = {
    turns: turns.map((t) => ({ speaker: t.speaker, role: t.speaker === agent ? 'agent' : t.speaker === customer ? 'customer' : 'other', start: Math.round(t.start * 10) / 10, text: t.text })),
    agentSpeaker: agent,
    customerSpeaker: customer,
    durationSec: meta.durationSec,
    languages: meta.languages,
  };
  return { results, transcript };
}
