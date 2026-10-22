import { useSite } from '../context/SiteContext.jsx';
import { Placeholder } from '../components/ui/Blocks.jsx';
import { emailFor } from '../utils/tokens.js';

/** About / Trust (React-only page) — laid out with the theme's section head, industry-style cards and check list. */
export default function AboutPage() {
  const { site } = useSite();
  const privacy = emailFor(site, 'privacy');
  return (
    <div className="tp-ct tp-about">
      <div className="wrap section">
        <div className="section-head">
          <div className="kicker">Not a software vendor</div>
          <h1>Operators First. Software Second.</h1>
          <p>Nimantran was built inside a live contact center — not designed in a product meeting and sold to operators afterward. CLAP, MAGIC Script and RESO exist because we had to run these floors ourselves first.</p>
        </div>

        <div className="ind-uses">
          <div className="ind-use"><h3>23+ years on the floor</h3><p>Not a product built in a meeting room — built running live contact-center operations.</p></div>
          <div className="ind-use"><h3>250+ enterprise clients</h3><p>The frameworks were built and proven on their floors, not a demo environment.</p></div>
          <div className="ind-use"><h3>No feature grid</h3><p>CLAP, MAGIC Script and RESO are the reason a features list wouldn&apos;t tell you much anyway.</p></div>
        </div>

        <h2 className="block-title">Security &amp; Compliance</h2>
        <ul className="ind-adv">
          <li><span>ISO 27001:2022 certified information security practices</span></li>
          <li><span>Data processed under <Placeholder value={site.entityName} fallback="[operating entity name]" /> in accordance with India&apos;s Digital Personal Data Protection Act, 2023</span></li>
          <li><span>Demo call recordings and uploaded audio are deleted after your session — see our Data Retention Policy</span></li>
          <li><span>Grievance/data contact: {privacy.includes('[domain]') ? <>privacy@<span className="legal-placeholder">[domain]</span></> : privacy}</span></li>
        </ul>
      </div>
    </div>
  );
}
