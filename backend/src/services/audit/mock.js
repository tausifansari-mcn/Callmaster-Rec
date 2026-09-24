import crypto from 'node:crypto';
import { rubricFor } from './rubrics.js';
import { bandFor, overallScore } from './scoring.js';

const rand = (min, max) => crypto.randomInt(min, max + 1);

/**
 * Sandbox scorecard used ONLY when the Deepgram / Anthropic keys are not configured: randomised values in the
 * same report shape, clearly flagged `mock: true` so the UI can label it as a sample.
 */
export function buildMockAudit(lob, name = 'the agent') {
  const rubric = rubricFor(lob);
  const parameters = rubric.parameters.map((p) => ({
    key: p.key, name: p.name, weight: p.weight, applicable: true, score: rand(5, 9),
    verdict: 'Sample verdict — configure the Deepgram and Anthropic API keys to get a real audit.', evidence: '', improvement: '',
  }));
  const score = overallScore(parameters);
  const results = {
    live: false,
    mock: true,
    lob: rubric.lob,
    framework: rubric.framework,
    score,
    ...bandFor(score),
    summary: 'This is a sample scorecard with randomised values. Add the Deepgram and Anthropic API keys to the server to transcribe and audit real calls.',
    callReason: 'Sample call', outcome: 'Sample outcome', resolution: 'not_applicable',
    fit: { matchesLob: true, note: '' },
    call: { durationSec: 0, languages: [], turns: 0, words: 0, speakers: 2, agentTalkPct: 50, customerTalkPct: 50 },
    sentiment: { customerStart: 'neutral', customerEnd: 'neutral', agentTone: 'good' },
    csat: rand(3, 5), csatPct: rand(58, 95), likelihoodToRecommend: rand(5, 9), nps: 'passive',
    parameters, strengths: [], improvements: [], coaching: [], compliance: [], keyMoments: [],
    risks: { escalation: 'low', socialMedia: 'low', note: '' },
  };
  const transcript = {
    turns: [
      { speaker: 0, role: 'agent', start: 0, text: `Thank you for calling, this is ${name} speaking, how can I help you today?` },
      { speaker: 1, role: 'customer', start: 5, text: 'Hi, I wanted to check on my recent order.' },
    ],
    agentSpeaker: 0, customerSpeaker: 1, durationSec: 0, languages: [],
  };
  return { results, transcript };
}
