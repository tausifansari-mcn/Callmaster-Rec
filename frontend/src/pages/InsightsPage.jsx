import ThemeFragment from '../components/ui/ThemeFragment.jsx';
import InsightsWizard from '../components/wizards/InsightsWizard.jsx';

/** Quality Audits — transcribed from the theme's template-quality-audits.php. */
export default function InsightsPage() {
  return (
    <section className="wrap section pp pp-audits">
      <ThemeFragment name="qa-banner" />
      <div className="section-head">
        <div className="kicker">Quality Audits</div>
        <h1>Stop sampling 2% of your calls and hoping the rest are fine.</h1>
        <p>Every recording gets the same rigor a senior QA analyst would give it — transcribed, scored against your own parameters, and flagged for coaching, in the time it takes to make coffee. Upload one of your own calls below and see it for yourself.</p>
        <div className="chip-row"><span className="chip">Inbound</span><span className="chip">Outbound sales</span><span className="chip">Collections</span><span className="chip">Sales campaigns</span></div>
      </div>

      <ThemeFragment name="ov-audits" />

      <div className="sandbox" id="qaSandbox">
        <div className="sandbox-head">
          <div><h3>Try it on your own call</h3><p style={{ margin: '6px 0 0', fontSize: 13 }}>One free trial per phone number.</p></div>
        </div>
        <InsightsWizard />
      </div>
      <ThemeFragment name="qa-media" />
      <ThemeFragment name="tail-audits" />
    </section>
  );
}
