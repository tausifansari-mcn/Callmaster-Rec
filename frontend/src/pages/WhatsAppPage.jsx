import { useSite } from '../context/SiteContext.jsx';
import { GoLink } from '../hooks/useGoto.jsx';
import { BenefitGrid, FaqSection, PageHero, Section } from '../components/ui/Blocks.jsx';
import PlanGrid from '../components/calculators/PlanGrid.jsx';
import { rate2 } from '../utils/format.js';

export default function WhatsAppPage() {
  const { pricing, faqs } = useSite();
  const { plans, interactionRates } = pricing.whatsapp;
  return (
    <section className="page active">
      <div className="container">
        <PageHero icon="whatsapp-api" illo="whatsapp-api" eyebrow="Official Meta green-tick API" title="Turn WhatsApp Into Your Busiest Sales Channel.">
          Your customers already live on WhatsApp — 98% open rates say so. CallMaster gives you the official, green-tick-verified Business API with a shared team inbox, catalog &amp; commerce, broadcast campaigns, and no-code chatbot flows — so every conversation is two-way, tracked, and handed off to a human the moment it needs one.
        </PageHero>

        <Section style={{ paddingTop: 0 }}>
          <h2>Why teams switch to CallMaster on WhatsApp</h2>
          <BenefitGrid items={[
            { icon: 'clap', title: 'Official green-tick verification', text: 'The badge that tells customers this is really you — provisioned end-to-end.' },
            { icon: 'user', title: 'One shared team inbox', text: 'Every agent sees every conversation — nothing falls through the cracks.' },
            { icon: 'commerce', title: 'Catalog & commerce built in', text: 'Share a cart link and take orders without leaving the chat.' },
            { icon: 'whatsapp-api', title: 'Broadcast campaigns & drip flows', text: 'Segmented sends with automation rules that branch on replies.' },
            { icon: 'circle-check', title: 'No-code chatbot builder', text: "Automate FAQs and hand off to a live agent the moment it's needed." },
            { icon: 'bars3', title: 'Plug-and-play integrations', text: 'CRM, Dialers and Deep Customer Insights — no rip-and-replace project.' },
          ]} />
        </Section>

        <Section id="whatsapp-pricing">
          <h2>Plans &amp; self-serve checkout</h2>
          <p className="no-price-note">Plan fees cover your platform, seats and automation. Pick a plan, verify your details, and pay online. Need a custom deal instead? <GoLink to="contact">Talk to sales</GoLink>.</p>
          <PlanGrid productKey="whatsapp-api" product="WhatsApp Business API" plans={plans} />
          <p className="plan-indicative">Indicative sandbox pricing, excl. GST — confirmed on the checkout summary before payment. Promo codes applied at checkout.</p>

          {interactionRates.length > 0 && (
            <div className="usage-pricing-box">
              <div className="upb-badge">Interaction charges — billed monthly based on usage</div>
              <h3>Meta's per-message rates, passed straight through</h3>
              <p style={{ fontSize: 13.5, color: 'var(--ink-soft)', margin: '0 0 14px' }}>On top of your plan, Meta charges per conversation-opening message by category. We pass this through at cost — no markup — billed monthly against your actual usage, since volume isn't known upfront and isn't part of the prepaid checkout total above.</p>
              <p className="table-scroll-hint">&larr; swipe to see all columns &rarr;</p>
              <div className="table-scroll" style={{ marginBottom: 0 }}>
                <table className="pricing-table">
                  <thead><tr><th>Category</th><th>Rate per message</th><th>Typical use</th></tr></thead>
                  <tbody>
                    {interactionRates.map((r) => (
                      <tr key={r.category}><td>{r.category}</td><td>₹{rate2(r.rate)}</td><td>{r.use}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="upb-note">Shown for reference — you'll see this itemized on your monthly invoice, not on the checkout screen above.</p>
            </div>
          )}
        </Section>

        <FaqSection items={faqs.whatsapp} />
      </div>
    </section>
  );
}
