import { useSite } from '../context/SiteContext.jsx';
import { BenefitGrid, PageHero, Placeholder, Section } from '../components/ui/Blocks.jsx';
import { emailFor } from '../utils/tokens.js';

export default function AboutPage() {
  const { site } = useSite();
  return (
    <section className="page active">
      <div className="container">
        <PageHero eyebrow="Not a software vendor" title="Operators First. Software Second.">
          CallMaster was built inside a live contact center — not designed in a product meeting and sold to operators afterward. CLAP, MAGIC Script and RESO exist because we had to run these floors ourselves first.
        </PageHero>
        <Section style={{ paddingTop: 0, paddingBottom: 0 }}>
          <BenefitGrid items={[
            { icon: 'clock', title: '23+ years on the floor', text: 'Not a product built in a meeting room — built running live contact-center operations.' },
            { icon: 'users', title: '250+ enterprise clients', text: 'The frameworks were built and proven on their floors, not a demo environment.' },
            { icon: 'audit', title: 'No feature grid', text: "CLAP, MAGIC Script and RESO are the reason a features list wouldn't tell you much anyway." },
          ]} />
        </Section>
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
