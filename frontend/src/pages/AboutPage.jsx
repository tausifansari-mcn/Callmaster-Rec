import { useSite } from '../context/SiteContext.jsx';
import { PageHero, Placeholder, Section } from '../components/ui/Blocks.jsx';
import { emailFor } from '../utils/tokens.js';

export default function AboutPage() {
  const { site } = useSite();
  return (
    <section className="page active">
      <div className="container">
        <PageHero eyebrow="Not a software vendor" title="Operators First. Software Second.">
          CallMaster was built inside a live contact center running 23+ years of operations for 250+ enterprise clients — not designed in a product meeting and sold to operators afterward. CLAP, MAGIC Script and RESO exist because we had to run these floors ourselves first. We don't compete on a features grid; the frameworks are the reason a features grid wouldn't tell you anything useful anyway.
        </PageHero>
        <Section style={{ paddingTop: 0 }}>
          <h2>Security &amp; Compliance</h2>
          <ul className="bullet-list">
            <li>ISO 27001:2022 certified information security practices</li>
            <li>Data processed under <Placeholder value={site.entityName} fallback="[operating entity name]" /> in accordance with India's Digital Personal Data Protection Act, 2023</li>
            <li>Demo call recordings and uploaded audio are deleted after your session — see our Data Retention Policy</li>
            <li>Grievance/data contact: {emailFor(site, 'privacy').includes('[domain]')
              ? <>privacy@<span className="legal-placeholder">[domain]</span></>
              : emailFor(site, 'privacy')}</li>
          </ul>
        </Section>
      </div>
    </section>
  );
}
