/**
 * Visual overview of a finished audit — hand-drawn SVG (no chart library), driven only by the stored report:
 * skill radar, where-the-points-went bars, talk-time timeline + donut, satisfaction gauges and the sentiment journey.
 * Every chart degrades gracefully when its data is missing.
 */
const mmss = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
const toneOf = (score10) => (score10 >= 8 ? 'good' : score10 >= 6 ? 'mid' : 'low');
const polar = (cx, cy, r, i, n) => {
  const a = -Math.PI / 2 + (i * 2 * Math.PI) / n;
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
};
/** Wraps a parameter name onto at most two short lines ("Opening & right-party verification" → ["Opening &", "right-party ver…"]). */
const wrapName = (name, max = 16) => {
  const lines = [];
  let cur = '';
  for (const w of String(name).split(/\s+/)) {
    if ((cur + ' ' + w).trim().length <= max) cur = (cur + ' ' + w).trim();
    else { if (cur) lines.push(cur); cur = w; }
  }
  if (cur) lines.push(cur);
  if (lines.length > 2) { lines.length = 2; lines[1] = `${lines[1].slice(0, max - 1)}…`; }
  return lines;
};

// ---------------------------------------------------------------- radar
function Radar({ parameters }) {
  const ps = parameters.filter((p) => p.applicable);
  if (ps.length < 3) return null;
  const W = 460;
  const H = 340;
  const cx = W / 2;
  const cy = H / 2 + 4;
  const R = 108;
  const n = ps.length;
  const ring = (frac) => ps.map((_, i) => polar(cx, cy, R * frac, i, n).join(',')).join(' ');
  const shape = ps.map((p, i) => polar(cx, cy, R * (p.score / 10), i, n).join(',')).join(' ');
  return (
    <div className="ar-card">
      <h3>Skill radar</h3>
      <p className="ar-sub">Each spoke is one scorecard parameter (0–10). The bigger and rounder the shape, the stronger the call.</p>
      <svg className="ar-chart ar-radar" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Radar chart of parameter scores">
        {[0.25, 0.5, 0.75, 1].map((f) => <polygon key={f} className="ring" points={ring(f)} />)}
        {ps.map((_, i) => { const [x, y] = polar(cx, cy, R, i, n); return <line key={i} className="spoke" x1={cx} y1={cy} x2={x} y2={y} />; })}
        {[5, 10].map((v) => <text key={v} className="ring-label" x={cx + 3} y={cy - (R * v) / 10 + 10}>{v}</text>)}
        <polygon className="shape" points={shape} style={{ transformOrigin: `${cx}px ${cy}px` }} />
        {ps.map((p, i) => {
          const [x, y] = polar(cx, cy, R * (p.score / 10), i, n);
          const [lx, ly] = polar(cx, cy, R + 20, i, n);
          const anchor = lx < cx - 8 ? 'end' : lx > cx + 8 ? 'start' : 'middle';
          return (
            <g key={p.key}>
              <circle className={`dot ${toneOf(p.score)}`} cx={x} cy={y} r="4.5"><title>{`${p.name}: ${p.score}/10`}</title></circle>
              {(() => {
                const lines = wrapName(p.name);
                const top = ly - ((lines.length - 1) * 6) - 6;
                return (
                  <>
                    <text className="axis-label" x={lx} y={top} textAnchor={anchor} dominantBaseline="middle">
                      {lines.map((ln, k) => <tspan key={k} x={lx} dy={k === 0 ? 0 : 11}>{ln}</tspan>)}
                    </text>
                    <text className={`axis-score ${toneOf(p.score)}`} x={lx} y={top + lines.length * 11 + 2} textAnchor={anchor} dominantBaseline="middle">{p.score}/10</text>
                  </>
                );
              })()}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ---------------------------------------------------------------- where the points went
function PointsChart({ parameters, score }) {
  const ps = parameters.filter((p) => p.applicable);
  const totalW = ps.reduce((s, p) => s + p.weight, 0);
  if (!ps.length || !totalW) return null;
  const rows = ps
    .map((p) => {
      const share = (p.weight / totalW) * 100;
      const gained = (share * p.score) / 10;
      return { key: p.key, name: p.name, share, gained, lost: share - gained, score: p.score };
    })
    .sort((a, b) => b.lost - a.lost);
  const max = Math.max(...rows.map((r) => r.share));
  const totalLost = rows.reduce((s, r) => s + r.lost, 0);
  return (
    <div className="ar-card">
      <h3>Where the points went</h3>
      <p className="ar-sub">Each bar is what a parameter is worth out of 100. Green is earned, red is lost — biggest losses first, so you know what to coach.</p>
      <div className="ar-points">
        {rows.map((r) => (
          <div className="pt-row" key={r.key} title={`${r.name}: earned ${r.gained.toFixed(1)} of ${r.share.toFixed(1)} points`}>
            <div className="pt-name">{r.name}</div>
            <div className="pt-bar" style={{ width: `${(r.share / max) * 100}%` }}>
              <i className={`gain ${toneOf(r.score)}`} style={{ width: `${(r.gained / r.share) * 100}%` }} />
              <i className="lost" style={{ width: `${(r.lost / r.share) * 100}%` }} />
            </div>
            <div className="pt-val">{r.lost >= 0.5 ? <span className="neg">−{r.lost.toFixed(1)}</span> : <span className="pos">full</span>}</div>
          </div>
        ))}
      </div>
      <div className="ar-legend" style={{ marginTop: 14, marginBottom: 0 }}>
        <div><i style={{ background: 'var(--accent-success)' }} />Points earned <b>{score}</b></div>
        <div><i style={{ background: 'rgba(255,110,94,0.55)' }} />Points lost <b>{totalLost.toFixed(0)}</b></div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- conversation timeline
function Timeline({ transcript, call }) {
  const turns = (transcript?.turns || []).filter((t) => Number.isFinite(t.start));
  if (turns.length < 2) return null;
  const segs = turns.map((t, i) => {
    const end = i < turns.length - 1 ? turns[i + 1].start : Math.max(t.start + 5, call?.durationSec || 0);
    return { role: t.role, start: t.start, end: Math.max(end, t.start + 0.6), words: t.text.split(/\s+/).length };
  });
  const total = Math.max(call?.durationSec || 0, ...segs.map((s) => s.end)) || 1;
  const W = 720;
  const padL = 74;
  const trackW = W - padL - 10;
  const x = (t) => padL + (t / total) * trackW;
  const lane = { agent: 34, customer: 82 };
  const ticks = Array.from({ length: 6 }, (_, i) => (total / 5) * i);
  const share = (role) => segs.filter((s) => s.role === role).reduce((a, s) => a + (s.end - s.start), 0);
  const aS = share('agent');
  const cS = share('customer');
  const longest = segs.reduce((m, s) => (s.end - s.start > m.end - m.start ? s : m), segs[0]);
  return (
    <div className="ar-card">
      <h3>Conversation timeline</h3>
      <p className="ar-sub">Who was speaking, moment by moment. Long unbroken blocks mean one side dominated the conversation.</p>
      <svg className="ar-chart ar-timeline-chart" viewBox={`0 0 ${W} 132`} role="img" aria-label="Speaker timeline">
        {ticks.map((t) => <line key={t} className="grid" x1={x(t)} x2={x(t)} y1="14" y2="104" />)}
        <text className="lane-label agent" x="0" y={lane.agent + 4}>Agent</text>
        <text className="lane-label customer" x="0" y={lane.customer + 4}>Customer</text>
        <line className="lane-base" x1={padL} x2={W - 10} y1={lane.agent + 16} y2={lane.agent + 16} />
        <line className="lane-base" x1={padL} x2={W - 10} y1={lane.customer + 16} y2={lane.customer + 16} />
        {segs.filter((s) => lane[s.role] !== undefined).map((s, i) => (
          <rect key={i} className={`seg ${s.role}`} x={x(s.start)} y={lane[s.role] - 14} width={Math.max(2, x(s.end) - x(s.start) - 1)} height="30" rx="3">
            <title>{`${s.role === 'agent' ? 'Agent' : 'Customer'} · ${mmss(s.start)}–${mmss(s.end)} · ~${s.words} words`}</title>
          </rect>
        ))}
        {ticks.map((t) => <text key={t} className="tick" x={x(t)} y="124" textAnchor="middle">{mmss(t)}</text>)}
      </svg>
      <div className="ar-legend" style={{ marginTop: 6, marginBottom: 0 }}>
        <div><i className="seg-agent" />Agent held the floor for <b>{mmss(aS)}</b></div>
        <div><i className="seg-customer" />Customer held the floor for <b>{mmss(cS)}</b></div>
        <div>Turns <b>{segs.length}</b></div>
        <div>Longest monologue <b>{mmss(longest.end - longest.start)}</b> ({longest.role === 'agent' ? 'agent' : 'customer'})</div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- donut
function TalkDonut({ call }) {
  if (!call || (!call.agentTalkPct && !call.customerTalkPct)) return null;
  const r = 46;
  const c = 2 * Math.PI * r;
  const a = call.agentTalkPct;
  return (
    <div className="ar-card ar-mini">
      <h3>Talk-time balance</h3>
      <p className="ar-sub">Share of words spoken.</p>
      <div className="ar-donut">
        <svg viewBox="0 0 120 120" role="img" aria-label={`Agent ${a}%, customer ${call.customerTalkPct}%`}>
          <circle className="cust" cx="60" cy="60" r={r} fill="none" strokeWidth="16" />
          <circle className="agent" cx="60" cy="60" r={r} fill="none" strokeWidth="16" strokeDasharray={`${(c * a) / 100} ${c}`} transform="rotate(-90 60 60)" />
        </svg>
        <div className="mid"><b>{a}%</b><span>agent</span></div>
      </div>
      <div className="ar-legend" style={{ gridTemplateColumns: '1fr', marginBottom: 0 }}>
        <div><i className="seg-agent" />Agent <b>{a}%</b></div>
        <div><i className="seg-customer" />Customer <b>{call.customerTalkPct}%</b></div>
        {call.words > 0 && <div>{call.words} words · {call.turns} turns</div>}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- semicircle gauge
function Gauge({ title, sub, value, max, display, tone }) {
  const r = 52;
  const half = Math.PI * r;
  const frac = Math.min(1, Math.max(0, value / max));
  return (
    <div className="ar-card ar-mini">
      <h3>{title}</h3>
      <p className="ar-sub">{sub}</p>
      <div className="ar-gauge">
        <svg viewBox="0 0 130 78" role="img" aria-label={`${title}: ${display}`}>
          <path className="track" d="M 13 65 A 52 52 0 0 1 117 65" fill="none" strokeWidth="13" strokeLinecap="round" />
          <path className={`bar ${tone}`} d="M 13 65 A 52 52 0 0 1 117 65" fill="none" strokeWidth="13" strokeLinecap="round" strokeDasharray={`${half * frac} ${half}`} />
        </svg>
        <div className={`val ${tone}`}>{display}</div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- sentiment journey
const LEVELS = { positive: 0, neutral: 1, negative: 2 };
function Journey({ sentiment, keyMoments }) {
  if (!sentiment) return null;
  const y = (k) => 20 + (LEVELS[k] ?? 1) * 30;
  const start = sentiment.customerStart;
  const end = sentiment.customerEnd;
  const trend = LEVELS[end] < LEVELS[start] ? 'improved' : LEVELS[end] > LEVELS[start] ? 'worsened' : 'held steady';
  const tone = trend === 'improved' ? 'pos' : trend === 'worsened' ? 'neg' : 'neu';
  // A gentle midpoint that leans towards the key moments' mood, when the report has any.
  const mood = (keyMoments || []).reduce((s, m) => s + (m.type === 'positive' ? -1 : m.type === 'negative' ? 1 : 0), 0);
  const midLevel = Math.max(0, Math.min(2, Math.round((LEVELS[start] + LEVELS[end]) / 2 + Math.sign(mood) * 0.6)));
  const pts = [[72, y(start)], [128, 20 + midLevel * 30], [184, y(end)]];
  const path = `M ${pts[0][0]} ${pts[0][1]} C ${pts[0][0] + 40} ${pts[0][1]}, ${pts[1][0] - 30} ${pts[1][1]}, ${pts[1][0]} ${pts[1][1]} S ${pts[2][0] - 40} ${pts[2][1]}, ${pts[2][0]} ${pts[2][1]}`;
  return (
    <div className="ar-card ar-mini">
      <h3>Customer sentiment</h3>
      <p className="ar-sub">Mood at the start vs the end of the call.</p>
      <svg className="ar-chart ar-journey" viewBox="0 0 200 100" role="img" aria-label={`Customer sentiment ${start} to ${end}`}>
        {['Positive', 'Neutral', 'Negative'].map((l, i) => (
          <g key={l}>
            <line className="grid" x1="52" x2="196" y1={20 + i * 30} y2={20 + i * 30} />
            <text className="tick" x="0" y={23 + i * 30} textAnchor="start">{l}</text>
          </g>
        ))}
        <path className={`line ${tone}`} d={path} fill="none" />
        <circle className="pt start" cx={pts[0][0]} cy={pts[0][1]} r="5" />
        <circle className={`pt end ${tone}`} cx={pts[2][0]} cy={pts[2][1]} r="6" />
        <text className="tick" x={pts[0][0]} y="92" textAnchor="middle">Start</text>
        <text className="tick" x={pts[2][0]} y="92" textAnchor="middle">End</text>
      </svg>
      <div className="ar-callout" style={{ marginTop: 6, paddingTop: 8 }}>Sentiment <b className={tone}>{trend}</b>. Agent tone: <b>{sentiment.agentTone}</b>.</div>
    </div>
  );
}

export default function AuditCharts({ results: r, transcript }) {
  const csatTone = r.csatPct >= 80 ? 'pos' : r.csatPct >= 60 ? 'neu' : 'neg';
  const ltrTone = r.likelihoodToRecommend >= 9 ? 'pos' : r.likelihoodToRecommend >= 7 ? 'neu' : 'neg';
  return (
    <div className="ar-charts">
      <div className="ar-grid2 even">
        <Radar parameters={r.parameters} />
        <PointsChart parameters={r.parameters} score={r.score} />
      </div>
      <Timeline transcript={transcript} call={r.call} />
      <div className="ar-grid4">
        <TalkDonut call={r.call} />
        <Gauge title="Perceived CSAT" sub="How satisfied the customer sounded." value={r.csatPct} max={100} display={`${r.csatPct}%`} tone={csatTone} />
        <Gauge title="Likelihood to recommend" sub="Score out of 10." value={r.likelihoodToRecommend} max={10} display={`${r.likelihoodToRecommend}/10`} tone={ltrTone} />
        <Journey sentiment={r.sentiment} keyMoments={r.keyMoments} />
      </div>
    </div>
  );
}
