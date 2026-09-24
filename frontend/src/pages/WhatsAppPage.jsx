import { useSite } from '../context/SiteContext.jsx';
import { GoLink } from '../hooks/useGoto.jsx';
import { FaqSection, PageHero, Section } from '../components/ui/Blocks.jsx';
import PlanGrid from '../components/calculators/PlanGrid.jsx';
import { rate2 } from '../utils/format.js';

export default function WhatsAppPage() {
  const { pricing, faqs } = useSite();
  const { plans, interactionRates } = pricing.whatsapp;
  return (
    <section className="page active">
      <div className="container">
        <PageHero icon="whatsapp-api" eyebrow="Official Meta green-tick API" title="Turn WhatsApp Into Your Busiest Sales Channel.">
          Your customers already live on WhatsApp — 98% open rates say so. CallMaster gives you the official, green-tick-verified Business API with a shared team inbox, catalog &amp; commerce, broadcast campaigns, and no-code chatbot flows — so every conversation is two-way, tracked, and handed off to a human the moment it needs one.
        </PageHero>

        <Section style={{ paddingTop: 0 }}>
          <h2>Why teams switch to CallMaster on WhatsApp</h2>
          <ul className="bullet-list">
            <li><b>Official green-tick verification</b> — the blue/green badge that tells customers this is really you, provisioned end-to-end as part of onboarding.</li>
            <li><b>One shared team inbox</b> — every agent sees every conversation, with assignment, labels and internal notes, so nothing falls through the cracks between reps.</li>
            <li><b>Catalog &amp; commerce built in</b> — showcase products, share a cart link, and take orders without the customer ever leaving the chat.</li>
            <li><b>Broadcast campaigns &amp; drip flows</b> — segment your list and send approved template campaigns, with automation rules that branch on replies.</li>
            <li><b>No-code chatbot builder</b> — automate FAQs, qualification and order status; hand off to a live agent instantly when the bot hits its limit.</li>
            <li><b>Plug-and-play integrations</b> — connects to your CRM, Dialers and Deep Customer Insights scoring out of the box, no rip-and-replace project.</li>
          </ul>
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
