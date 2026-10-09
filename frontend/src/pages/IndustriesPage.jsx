import { Link } from 'react-router-dom';
import { PageHero, Section } from '../components/ui/Blocks.jsx';
import { IndustryArt } from '../components/ui/Icons.jsx';
import { INDUSTRIES, INDUSTRY_LETTERS } from '../data/industries.js';

/** Industries hub (/industries) — one card per industry, linking to /industries/:slug. */
export default function IndustriesPage() {
  return (
    <section className="page active">
      <div className="container">
        <PageHero eyebrow="Industries" title="Built for the way your industry talks to customers.">
          Every sector has its own calls: renewals, EMIs, appointments, deliveries. Pick yours to see how teams like yours can use Nimantran.
        </PageHero>

        <Section style={{ paddingTop: 0 }}>
          <div className="card-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))' }}>
            {INDUSTRIES.map((ind) => (
              <Link
                key={ind.slug}
                to={`/industries/${ind.slug}`}
                className="prod-card"
                style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
              >
                <IndustryArt slug={ind.slug} letters={INDUSTRY_LETTERS[ind.slug]} size={56} />
                <h3 style={{ marginTop: 14 }}>{ind.name}</h3>
                <p>{ind.title}</p>
              </Link>
            ))}
          </div>
        </Section>
      </div>
    </section>
  );
}
