import { GoButton } from '../../hooks/useGoto.jsx';
import AuditCharts from './AuditCharts.jsx';

const mmss = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
const cap = (s) => String(s || '').replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase());
const toneOf = (score10) => (score10 >= 8 ? 'good' : score10 >= 6 ? 'mid' : 'low');
const sentimentClass = { positive: 'pos', neutral: 'neu', negative: 'neg' };
const LANG = { en: 'English', hi: 'Hindi', multi: 'Multilingual' };

// ---------------------------------------------------------------- pieces
export function ScoreRing({ score, band }) {
  const r = 54;
  const c = 2 * Math.PI * r;
  return (
    <div className={`ar-ring ${band}`} role="img" aria-label={`Quality score ${score} out of 100`}>
      <svg viewBox="0 0 128 128">
        <circle className="track" cx="64" cy="64" r={r} fill="none" strokeWidth="10" />
        <circle className="bar" cx="64" cy="64" r={r} fill="none" strokeWidth="10" strokeDasharray={c} strokeDashoffset={c * (1 - score / 100)} />
      </svg>
      <div className="ar-ring-num"><b>{score}</b><span>OUT OF 100</span></div>
    </div>
  );
}

function Kpis({ r }) {
  const nps = { promoter: ['Promoter', 'pos'], passive: ['Passive', 'neu'], detractor: ['Detractor', 'neg'] }[r.nps] || ['—', 'neu'];
  return (
    <div className="ar-kpis">
      <div className="ar-kpi">
        <div className="k">Perceived CSAT</div>
        <div className={`v ${r.csatPct >= 80 ? 'pos' : r.csatPct >= 60 ? 'neu' : 'neg'}`}>{r.csatPct}%</div>
        <div className="s">{r.csat} out of 5 satisfaction</div>
      </div>
      <div className="ar-kpi">
        <div className="k">Likelihood to recommend</div>
        <div className={`v ${nps[1]}`}>{r.likelihoodToRecommend}<span style={{ fontSize: 14, color: 'var(--ink-faint)' }}>/10</span></div>
        <div className="s">{nps[0]}</div>
      </div>
      <div className="ar-kpi">
        <div className="k">Customer sentiment</div>
        <div className="v" style={{ fontSize: 15, lineHeight: 1.4 }}>
          <span className={sentimentClass[r.sentiment.customerStart]}>{cap(r.sentiment.customerStart)}</span>
          {' → '}
          <span className={sentimentClass[r.sentiment.customerEnd]}>{cap(r.sentiment.customerEnd)}</span>
        </div>
        <div className="s">Agent tone: {r.sentiment.agentTone}</div>
      </div>
      <div className="ar-kpi">
        <div className="k">Resolution</div>
        <div className={`v ${r.resolution === 'resolved' ? 'pos' : r.resolution === 'unresolved' ? 'neg' : 'neu'}`} style={{ fontSize: 18 }}>{r.resolution === 'not_applicable' ? 'N/A' : cap(r.resolution)}</div>
        <div className="s">{r.outcome}</div>
      </div>
    </div>
  );
}

function Scorecard({ parameters }) {
  return (
    <div className="ar-card">
      <h3>Scorecard</h3>
      <p className="ar-sub">Every parameter is scored 0–10 from evidence in the call, then weighted into the overall score.</p>
      {parameters.map((p) => (
        <div className={`ar-param${p.applicable ? '' : ' ar-na'}`} key={p.key}>
          <div className="ar-param-head">
            <div className="ar-param-name">{p.name}<small>weight {p.weight}</small></div>
            <div className={`ar-param-score ${p.applicable ? { good: 'pos', mid: 'neu', low: 'neg' }[toneOf(p.score)] : ''}`}>{p.applicable ? `${p.score}/10` : 'N/A'}</div>
          </div>
          {p.applicable && <div className="ar-track"><div className={`ar-fill ${toneOf(p.score)}`} style={{ width: `${p.score * 10}%` }} /></div>}
          {p.verdict && <p className="ar-verdict">{p.verdict}</p>}
          {p.applicable && (p.evidence || p.improvement) && (
            <details>
              <summary>Evidence &amp; coaching</summary>
              {p.evidence && <div className="ar-evidence">{p.evidence}</div>}
              {p.improvement && <div className="ar-fix"><b>Coach</b>{p.improvement}</div>}
            </details>
          )}
        </div>
      ))}
    </div>
  );
}

function ClapPanel({ clap }) {
  const rows = [['c', 'Customer', clap.customer], ['l', 'Logistics & operations', clap.logistics], ['a', 'Agent', clap.agent], ['p', 'Product', clap.product]];
  return (
    <div className="ar-card">
      <h3>CLAP — who or what caused this call</h3>
      <p className="ar-sub">Most QA blames the agent. CLAP splits the root cause across the whole chain.</p>
      <div className="ar-stack" role="img" aria-label="Root-cause split">
        {rows.filter((x) => x[2] > 0).map(([k, , v]) => <span key={k} className={`seg-${k}`} style={{ flexGrow: v }}>{v >= 8 ? `${v}%` : ''}</span>)}
      </div>
      <div className="ar-legend">
        {rows.map(([k, label, v]) => <div key={k}><i className={`seg-${k}`} />{label} <b>{v}%</b></div>)}
      </div>
      <div className="ar-callout"><b>Root cause.</b> {clap.rootCause}</div>
    </div>
  );
}

function MagicPanel({ magic, lob }) {
  const q = (s) => magic.stages.find((x) => x.stage === s);
  return (
    <div className="ar-card">
      <h3>MAGIC Script — CRT / CST read</h3>
      <p className="ar-sub">How this call moved from stage to stage, and where it stalled.</p>
      <div className="ar-funnel">
        {magic.stages.map((s, i) => (
          <div key={s.stage} className={`ar-stage${s.reached ? ' reached' : ''}${magic.dropOffStage === s.stage ? ' drop' : ''}`} title={s.note}>
            <div className="dot">{s.reached ? (magic.dropOffStage === s.stage ? '!' : '✓') : i + 1}</div>
            <div className="nm">{s.stage}</div>
            <div className="q">{s.reached ? `${s.quality}/10` : '—'}</div>
          </div>
        ))}
      </div>
      <div className="ar-kv">
        <div><b>Drop-off stage (CRT)</b>{magic.dropOffStage === 'none' ? 'None — the call reached its outcome.' : `${cap(magic.dropOffStage)} — ${q(magic.dropOffStage)?.note || ''}`}{magic.crtRead && <><br />{magic.crtRead}</>}</div>
        {magic.cstRead && <div><b>Success trajectory (CST)</b>{magic.cstRead}</div>}
        {magic.winningMoment && <div><b>Strongest moment</b>{magic.winningMoment}</div>}
        {magic.suggestedRebuttal && <div><b>Try this talk-track</b>{magic.suggestedRebuttal}</div>}
        {magic.retention && (
          <div><b>Retention read</b>Reason: {magic.retention.reason}. Offer: {magic.retention.offerMade}. Outcome: {cap(magic.retention.saveOutcome)} · churn risk after call: {magic.retention.churnRiskAfterCall}.</div>
        )}
        <div><b>Recommendation for the floor</b>{magic.recommendation}</div>
        <div><b>Call outcome</b>{cap(magic.outcome)}{lob === 'Retention' ? '' : ''}</div>
      </div>
    </div>
  );
}

function ResoPanel({ reso }) {
  const tone = reso.confidence >= 65 ? 'var(--accent-success)' : reso.confidence >= 45 ? 'var(--accent-live)' : 'var(--accent-alert)';
  return (
    <div className="ar-card">
      <h3>RESO — promise-to-pay read</h3>
      <p className="ar-sub">Which promises are actually likely to convert into payment.</p>
      <div className="ar-kv" style={{ marginBottom: 6 }}>
        <div><b>PTP confidence</b>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 26, color: tone }}>{reso.confidence}%</span>
          <span className={reso.genuine ? 'reso-genuine' : 'reso-flag'} style={{ marginLeft: 10 }}>{reso.ptpCaptured ? (reso.genuine ? 'Likely genuine' : 'Low confidence — flag for early follow-up') : 'No promise captured'}</span>
          <div className="ar-meter"><i style={{ width: `${reso.confidence}%`, background: tone }} /></div>
        </div>
      </div>
      <div className="ar-ptp">
        <div><div className="k">Amount</div><div className="v">{reso.amount}</div></div>
        <div><div className="k">Date</div><div className="v">{reso.date}</div></div>
        <div><div className="k">Mode</div><div className="v">{reso.mode}</div></div>
      </div>
      <div className="ar-kv">
        <div><b>Why this rating</b>{reso.reasoning}</div>
        <div><b>Reason for non-payment</b>{reso.nonPaymentReason}{reso.disputeRaised ? ' (dispute raised)' : ''}</div>
        {reso.riskSignals.length > 0 && <div><b>Risk signals</b>{reso.riskSignals.join(' · ')}</div>}
        <div><b>Follow-up recommendation</b>{reso.recommendation}</div>
      </div>
    </div>
  );
}

function Compliance({ items, risks }) {
  const icon = { pass: ['ok', '✓'], fail: ['bad', '✕'], na: ['na', '–'] };
  return (
    <div className="ar-card">
      <h3>Compliance &amp; risk</h3>
      <p className="ar-sub">Checks specific to this line of business.</p>
      <ul className="ar-list">
        {items.map((c) => (
          <li key={c.check}><span className={`ic ${icon[c.status][0]}`}>{icon[c.status][1]}</span><span><b>{c.check}</b>{c.note && <span className="note">{c.note}</span>}</span></li>
        ))}
      </ul>
      <div className="ar-callout" style={{ marginTop: 14 }}>
        <b>Escalation risk:</b> <span className={{ low: 'pos', medium: 'neu', high: 'neg' }[risks.escalation]}>{cap(risks.escalation)}</span>
        {'  ·  '}<b>Social-media risk:</b> <span className={{ low: 'pos', medium: 'neu', high: 'neg' }[risks.socialMedia]}>{cap(risks.socialMedia)}</span>
        {risks.note && <><br />{risks.note}</>}
      </div>
    </div>
  );
}

function Transcript({ transcript }) {
  if (!transcript?.turns?.length) return null;
  return (
    <div className="ar-card">
      <h3>Full transcript</h3>
      <p className="ar-sub">Speech-to-text with speaker separation{transcript.languages?.length ? ` · detected: ${transcript.languages.map((l) => LANG[l] || l).join(', ')}` : ''}.</p>
      <div className="ar-transcript">
        {transcript.turns.map((t, i) => (
          <div className={`ar-turn ${t.role}`} key={i}>
            <time>{mmss(t.start)}</time>
            <p><span className="who">{t.role === 'agent' ? 'Agent' : t.role === 'customer' ? 'Customer' : `Speaker ${t.speaker}`}</span>{t.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- report
/** The full audit output. Renders defensively — every section is optional. */
export default function AuditReport({ results: r, transcript, submitter, admin = false }) {
  const langs = (r.call?.languages || []).map((l) => LANG[l] || l).join(' + ');
  return (
    <section className="ar" id="audit-report">
      <div className="ar-hero">
        <ScoreRing score={r.score} band={r.band} />
        <div>
          <div className="eyebrow">Audit report · {r.framework}</div>
          <h2>{r.lob} call audit<span className={`ar-band ${r.band}`}>{r.bandLabel}</span></h2>
          <p className="ar-summary">{r.summary}</p>
          <div className="ar-chips">
            {r.call?.durationSec > 0 && <span className="ar-chip">Duration <b>{mmss(r.call.durationSec)}</b></span>}
            {langs && <span className="ar-chip">Language <b>{langs}</b></span>}
            {r.call?.durationSec > 0 && <span className="ar-chip">Talk time <b>Agent {r.call.agentTalkPct}% · Customer {r.call.customerTalkPct}%</b></span>}
            {r.callReason && <span className="ar-chip">Reason <b>{r.callReason}</b></span>}
          </div>
        </div>
      </div>

      {r.mock && <div className="ar-note warn"><b>Sample scorecard.</b> {r.summary}</div>}
      {!r.mock && r.fit && !r.fit.matchesLob && (
        <div className="ar-note warn"><b>Heads-up:</b> this recording doesn't look like a {r.lob} call. {r.fit.note} The audit below still applies the {r.lob} rubric — pick the matching line of business for the most accurate result.</div>
      )}

      <Kpis r={r} />

      <AuditCharts results={r} transcript={transcript} />

      <div className="ar-grid2">
        <Scorecard parameters={r.parameters} />
        <div>
          {r.clap && <ClapPanel clap={r.clap} />}
          {r.magic && <MagicPanel magic={r.magic} lob={r.lob} />}
          {r.reso && <ResoPanel reso={r.reso} />}
          {r.compliance?.length > 0 && <Compliance items={r.compliance} risks={r.risks} />}
        </div>
      </div>

      <div className="ar-grid2 even">
        {r.strengths?.length > 0 && (
          <div className="ar-card">
            <h3>What went well</h3>
            <p className="ar-sub">Behaviours worth repeating and sharing.</p>
            <ul className="ar-list">{r.strengths.map((s, i) => <li key={i}><span className="ic ok">✓</span><span>{s}</span></li>)}</ul>
          </div>
        )}
        {r.improvements?.length > 0 && (
          <div className="ar-card">
            <h3>Areas to improve</h3>
            <p className="ar-sub">Most important first.</p>
            <ul className="ar-list">{r.improvements.map((s, i) => <li key={i}><span className={`ar-tag ${s.priority}`}>{s.tag}</span><span>{s.text}</span></li>)}</ul>
          </div>
        )}
      </div>

      <div className="ar-grid2 even">
        {r.coaching?.length > 0 && (
          <div className="ar-card">
            <h3>Coaching plan</h3>
            <p className="ar-sub">What the team leader should work on next.</p>
            <ul className="ar-list ar-coach">{r.coaching.map((s, i) => <li key={i}><span>{s}</span></li>)}</ul>
          </div>
        )}
        {r.keyMoments?.length > 0 && (
          <div className="ar-card">
            <h3>Key moments</h3>
            <p className="ar-sub">The turning points of the call.</p>
            <ul className="ar-timeline">{r.keyMoments.map((m, i) => <li key={i} className={m.type}><time>{m.at}</time>{m.label}</li>)}</ul>
          </div>
        )}
      </div>

      <Transcript transcript={transcript} />

      {!admin && (
        <div className="ar-actions">
          <GoButton to="audit" anchor="audit-pricing" className="btn secondary">See pricing</GoButton>
          <GoButton to="contact" className="btn">Talk to sales</GoButton>
        </div>
      )}
      {submitter && <div className="ar-footnote">Uploaded as: {submitter.company} · {submitter.email} · LOB: {r.lob}{r.model ? ` · audited by ${r.model}` : ''}</div>}
    </section>
  );
}
