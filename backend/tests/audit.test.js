import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// Keys are fake and every network call is stubbed — this file never talks to Deepgram or Anthropic.
process.env.DEEPGRAM_API_KEY = 'dg-test-key';
process.env.ANTHROPIC_API_KEY = 'an-test-key';
process.env.ANTHROPIC_MODEL = 'claude-sonnet-5';

const { RUBRICS, LOBS, FRAMEWORK_BY_LOB, MAGIC_STAGES } = await import('../src/services/audit/rubrics.js');
const { overallScore, bandFor, buildResults } = await import('../src/services/audit/scoring.js');
const { buildToolSchema, auditTranscript, formatTranscript } = await import('../src/services/audit/claude.js');
const { transcribe } = await import('../src/services/audit/deepgram.js');
const { buildMockAudit } = await import('../src/services/audit/mock.js');

const cfg = { deepgramKey: 'dg-test-key', deepgramModel: 'nova-3', deepgramLanguage: 'multi', anthropicKey: 'an-test-key', anthropicModel: 'claude-sonnet-5' };
const realFetch = globalThis.fetch;
const stubFetch = (handler) => { globalThis.fetch = handler; };
const restoreFetch = () => { globalThis.fetch = realFetch; };
const json = (status, body) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

const turns = [
  { speaker: 0, start: 0, end: 5, text: 'Thank you for calling Shop Easy support, this is Priya speaking.' },
  { speaker: 1, start: 6, end: 12, text: 'Hi, my order has not arrived and I am very frustrated.' },
  { speaker: 0, start: 13, end: 20, text: 'I am sorry about that, let me check it for you right away.' },
];
const meta = { durationSec: 20, languages: ['en'], wordCount: 40 };

describe('rubrics', () => {
  test('every line of business has a rubric whose weights sum to 100', () => {
    assert.deepEqual(LOBS, ['Inbound Support', 'Outbound Sales', 'Collections', 'Retention']);
    for (const lob of LOBS) {
      const r = RUBRICS[lob];
      assert.equal(r.parameters.reduce((s, p) => s + p.weight, 0), 100, `${lob} weights`);
      assert.equal(new Set(r.parameters.map((p) => p.key)).size, r.parameters.length, `${lob} keys unique`);
      assert.equal(r.framework, FRAMEWORK_BY_LOB[lob]);
      assert.ok(r.compliance.length >= 4);
    }
  });

  test('framework-specific sections are wired per LOB', () => {
    assert.equal(RUBRICS['Inbound Support'].extra, 'clap');
    assert.equal(RUBRICS['Outbound Sales'].extra, 'magic');
    assert.equal(RUBRICS.Retention.extra, 'magic');
    assert.equal(RUBRICS.Collections.extra, 'reso');
  });

  test('the tool schema requires every rubric parameter key and the framework section', () => {
    for (const lob of LOBS) {
      const tool = buildToolSchema(RUBRICS[lob]);
      const keyEnum = tool.input_schema.properties.parameters.items.properties.key.enum;
      assert.deepEqual(keyEnum, RUBRICS[lob].parameters.map((p) => p.key));
      const extra = RUBRICS[lob].extra;
      assert.ok(tool.input_schema.properties[extra], `${lob} has ${extra}`);
      assert.ok(tool.input_schema.required.includes(extra));
    }
  });
});

describe('scoring', () => {
  test('overall score is the weighted mean of applicable parameters (never model-computed)', () => {
    const p = (weight, score, applicable = true) => ({ weight, score, applicable });
    assert.equal(overallScore([p(50, 10), p(50, 0)]), 50);
    assert.equal(overallScore([p(80, 10), p(20, 0)]), 80);
    assert.equal(overallScore([p(50, 10), p(50, 0, false)]), 100); // N/A parameters drop out and weights renormalise
    assert.equal(overallScore([]), 0);
  });

  test('bands match the original thresholds', () => {
    assert.equal(bandFor(80).band, 'good');
    assert.equal(bandFor(79).band, 'mid');
    assert.equal(bandFor(65).band, 'mid');
    assert.equal(bandFor(64).band, 'low');
  });

  test('buildResults survives malformed model output (clamps, defaults, fixes CLAP to 100%)', () => {
    const rubric = RUBRICS['Inbound Support'];
    const raw = {
      speakerRoles: { agent: 0, customer: 1 },
      csat: 99, likelihoodToRecommend: -4,
      parameters: [
        { key: 'greeting', applicable: true, score: 15, verdict: 'ok', evidence: '', improvement: '' }, // out of range
        { key: 'not-a-real-key', applicable: true, score: 5 },
      ],
      improvements: [{ tag: 'NONSENSE', priority: 'urgent', text: 'Fix it' }],
      clap: { customer: 10, logistics: 10, agent: 10, product: 10, rootCause: 'x' }, // sums to 40, not 100
    };
    const { results, transcript } = buildResults({ rubric, raw, turns, meta, model: 'm' });
    assert.equal(results.parameters.length, rubric.parameters.length);
    assert.equal(results.parameters.find((x) => x.key === 'greeting').score, 10); // clamped
    assert.equal(results.parameters.find((x) => x.key === 'listening').applicable, false); // missing → N/A
    assert.equal(results.csat, 5);
    assert.equal(results.likelihoodToRecommend, 0);
    assert.equal(results.nps, 'detractor');
    assert.equal(results.improvements[0].tag, 'OTHER');
    assert.equal(results.improvements[0].priority, 'medium');
    const c = results.clap;
    assert.equal(c.customer + c.logistics + c.agent + c.product, 100);
    assert.equal(results.compliance.length, rubric.compliance.length);
    assert.equal(results.call.agentTalkPct + results.call.customerTalkPct, 100);
    assert.equal(transcript.turns[0].role, 'agent');
    assert.equal(transcript.turns[1].role, 'customer');
  });

  test('collections and sales/retention results carry their own sections', () => {
    const reso = buildResults({ rubric: RUBRICS.Collections, raw: { reso: { ptpCaptured: true, confidence: 82, amount: '₹5,000', date: 'Friday', mode: 'UPI', reasoning: 'firm date', riskSignals: ['a', 'b', 'c', 'd', 'e'] } }, turns, meta, model: 'm' }).results;
    assert.equal(reso.reso.confidence, 82);
    assert.equal(reso.reso.genuine, true);
    assert.equal(reso.reso.riskSignals.length, 4);
    const magic = buildResults({ rubric: RUBRICS.Retention, raw: { magic: { stages: [{ stage: 'opening', reached: true, quality: 7, note: 'n' }], dropOffStage: 'offer', retention: { reason: 'price', offerMade: '10% off', saveOutcome: 'saved', churnRiskAfterCall: 'low' } } }, turns, meta, model: 'm' }).results;
    assert.deepEqual(magic.magic.stages.map((s) => s.stage), MAGIC_STAGES);
    assert.equal(magic.magic.stages[1].reached, false);
    assert.equal(magic.magic.retention.saveOutcome, 'saved');
  });

  test('the sandbox fallback returns the same report shape, flagged as mock', () => {
    for (const lob of LOBS) {
      const { results, transcript } = buildMockAudit(lob, 'Asha');
      assert.equal(results.mock, true);
      assert.equal(results.parameters.length, RUBRICS[lob].parameters.length);
      assert.ok(results.score >= 0 && results.score <= 100);
      assert.ok(transcript.turns.length > 0);
    }
  });
});

describe('Claude client (network stubbed)', () => {
  test('sends the rubric, transcript and a forced tool call; returns the tool input', async () => {
    let seen;
    stubFetch(async (url, init) => {
      seen = { url: String(url), headers: init.headers, body: JSON.parse(init.body) };
      return json(200, { model: 'claude-sonnet-5', stop_reason: 'tool_use', usage: { input_tokens: 1, output_tokens: 1 }, content: [{ type: 'tool_use', name: 'submit_audit', input: { summary: 'ok' } }] });
    });
    try {
      const out = await auditTranscript({ rubric: RUBRICS.Collections, turns, meta, cfg });
      assert.equal(out.audit.summary, 'ok');
      assert.equal(seen.url, 'https://api.anthropic.com/v1/messages');
      assert.equal(seen.headers['x-api-key'], 'an-test-key');
      assert.deepEqual(seen.body.tool_choice, { type: 'tool', name: 'submit_audit' });
      assert.match(seen.body.system, /RESO/);
      assert.match(seen.body.system, /promise-to-pay/i);
      assert.match(seen.body.messages[0].content, /\[00:06\] Speaker 1: Hi, my order/);
    } finally { restoreFetch(); }
  });

  test('falls back to auto tool choice for models that reject a forced one', async () => {
    const choices = [];
    stubFetch(async (_u, init) => {
      const body = JSON.parse(init.body);
      choices.push(body.tool_choice.type);
      if (body.tool_choice.type === 'tool') return json(400, { error: { message: 'tool_choice: type "tool" is not supported for this model.' } });
      return json(200, { stop_reason: 'tool_use', content: [{ type: 'tool_use', name: 'submit_audit', input: { summary: 'auto' } }] });
    });
    try {
      assert.equal((await auditTranscript({ rubric: RUBRICS.Retention, turns, meta, cfg })).audit.summary, 'auto');
      assert.deepEqual(choices, ['tool', 'auto']);
    } finally { restoreFetch(); }
  });

  test('provider errors become AuditErrors whose public message never leaks internals', async () => {
    stubFetch(async () => json(401, { error: { message: 'invalid x-api-key an-test-key' } }));
    try {
      await assert.rejects(auditTranscript({ rubric: RUBRICS.Collections, turns, meta, cfg }), (err) => {
        assert.equal(err.code, 'CLAUDE_401');
        assert.ok(!err.publicMessage.includes('an-test-key') && !/anthropic|401/i.test(err.publicMessage));
        return true;
      });
    } finally { restoreFetch(); }
  });

  test('formatTranscript labels speakers and timestamps', () => {
    assert.match(formatTranscript(turns), /^\[00:00\] Speaker 0: Thank you/);
  });
});

describe('Deepgram client (network stubbed)', () => {
  const tmp = path.join(os.tmpdir(), `cm-audio-${Date.now()}.wav`);
  fs.writeFileSync(tmp, Buffer.from('RIFFfake'));

  const dgBody = (utterances, duration = 20) => ({ metadata: { duration }, results: { utterances, channels: [{ alternatives: [{ languages: ['en', 'hi'] }] }] } });
  const utt = (speaker, start, end, transcript) => ({ speaker, start, end, transcript });

  test('merges consecutive same-speaker fragments into turns and reports duration/languages', async () => {
    let seen;
    stubFetch(async (url, init) => {
      seen = { url: String(url), headers: init.headers };
      return json(200, dgBody([
        utt(0, 0, 2, 'Thank you for calling Shop Easy support.'), utt(0, 2, 4, 'This is Priya speaking.'),
        utt(1, 5, 9, 'Hi, my order has not arrived and I am really frustrated about it.'),
        utt(0, 10, 14, 'I am so sorry, let me check that for you right now please.'),
      ]));
    });
    try {
      const out = await transcribe(tmp, cfg);
      assert.equal(out.turns.length, 3);
      assert.equal(out.turns[0].text, 'Thank you for calling Shop Easy support. This is Priya speaking.');
      assert.equal(out.durationSec, 20);
      assert.deepEqual(out.languages, ['en', 'hi']);
      assert.match(seen.url, /model=nova-3/);
      assert.match(seen.url, /diarize=true/);
      assert.match(seen.url, /language=multi/);
      assert.equal(seen.headers.Authorization, 'Token dg-test-key');
    } finally { restoreFetch(); }
  });

  test('a silent / unusable recording is reported as NO_SPEECH with a friendly message', async () => {
    stubFetch(async () => json(200, dgBody([utt(0, 0, 1, 'hello')])));
    try {
      await assert.rejects(transcribe(tmp, cfg), (err) => err.code === 'NO_SPEECH' && /couldn't detect enough speech/i.test(err.publicMessage));
    } finally { restoreFetch(); }
  });

  test('retries with language detection when multilingual mode is rejected', async () => {
    const urls = [];
    stubFetch(async (url) => {
      urls.push(String(url));
      return urls.length === 1 ? json(400, { err_msg: 'multi not supported' }) : json(200, dgBody([utt(0, 0, 9, 'This is a long enough sentence to count as real speech from someone.'), utt(1, 9, 15, 'And here is the customer answering back with several more words too.')]));
    });
    try {
      const out = await transcribe(tmp, cfg);
      assert.equal(out.turns.length, 2);
      assert.match(urls[0], /language=multi/);
      assert.match(urls[1], /detect_language=true/);
    } finally { restoreFetch(); }
  });

  test('auth / billing failures are technical-only, with a generic public message', async () => {
    stubFetch(async () => json(401, { err_msg: 'INVALID_AUTH dg-test-key' }));
    try {
      await assert.rejects(transcribe(tmp, cfg), (err) => err.code === 'DEEPGRAM_401' && !err.publicMessage.includes('dg-test-key'));
    } finally { restoreFetch(); }
  });
});
