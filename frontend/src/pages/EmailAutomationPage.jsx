import { useSite } from '../context/SiteContext.jsx';
import { GoLink } from '../hooks/useGoto.jsx';
import { BulletList, FaqSection, PageHero, Section } from '../components/ui/Blocks.jsx';
import PlanGrid from '../components/calculators/PlanGrid.jsx';

export default function EmailAutomationPage() {
  const { pricing, faqs } = useSite();
  return (
    <section className="page active">
      <div className="container">
        <PageHero icon="email-automation" title="Email Sequences That Run Themselves — And Feed Your Pipeline.">
          Drip campaigns, deliverability monitoring and reply-triggered follow-ups, built for outbound and lifecycle email at BPO scale.
        </PageHero>
        <Section style={{ paddingTop: 0 }}>
          <h2>What you get</h2>
          <BulletList items={[
            'Drag-and-drop sequence builder with reply/click-triggered branching',
            'Deliverability monitoring — bounce, spam-complaint and domain health',
            'A/B testing on subject lines and send times',
            'Native CRM sync for lead status updates',
            'Unsubscribe & compliance management',
          ]} />
        </Section>
        <Section id="email-pricing">
          <h2>Plans &amp; self-serve checkout</h2>
          <p className="no-price-note">Pick a plan, verify your details, and pay online. Need a custom deal instead? <GoLink to="contact">Talk to sales</GoLink>.</p>
          <PlanGrid productKey="email-automation" product="Email Automation" plans={pricing.emailAutomation.plans} />
          <p className="plan-indicative">Indicative sandbox pricing, excl. GST — confirmed on the checkout summary before payment.</p>
        </Section>
        <FaqSection items={faqs.email} />
      </div>
    </section>
  );
}
