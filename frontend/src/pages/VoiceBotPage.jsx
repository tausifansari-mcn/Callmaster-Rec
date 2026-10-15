import { useSite } from '../context/SiteContext.jsx';
import { GoButton, GoLink } from '../hooks/useGoto.jsx';
import { FaqSection, PageHero, Section } from '../components/ui/Blocks.jsx';
import ProductOverview from '../components/ui/ProductOverview.jsx';
import VoiceSetupCalculator from '../components/calculators/VoiceSetupCalculator.jsx';
import VoiceWizard from '../components/wizards/VoiceWizard.jsx';
import { rate, rate2 } from '../utils/format.js';

const OV_STEPS = [
  { title: 'Write the script', text: 'Share your use case and the points the bot must cover.' },
  { title: 'Choose the voice', text: 'Pick language, accent and voice style.' },
  { title: 'Hear it on your phone', text: 'Receive a live bot call on your own number before you commit.' },
];

const HIGHLIGHTS = [
  { title: 'English, Hindi and Hinglish', text: 'Talk to customers the way they actually speak, with Indian, British or American accents to match your brand.' },
  { title: 'Your script, your flow', text: 'Build the conversation around your process: questions, branches, confirmations and handover rules.' },
  { title: 'Always on', text: 'Calls go out and come in at any hour, without overtime or a shrinking team on festival days.' },
  { title: 'Scale up in an afternoon', text: 'Reach thousands of customers in the time a team would reach a few hundred.' },
  { title: 'Hand-off to a human', text: 'Escalate to an agent when the customer asks, or when the conversation goes off script.' },
  { title: 'Pay by the minute', text: 'Pricing starts at ₹3.5 per minute, so cost follows usage, with no fixed seat to fill.' },
];

export default function VoiceBotPage() {
  const { pricing, faqs } = useSite();
  const perMin = pricing.voiceBot.perMinuteRate;
  return (
    <section className="page active">
      <div className="container">
        <PageHero eyebrow="Voice Bots" title="A bot your customers won't hang up on.">
          Pick the accent, the voice, the script — English, Hindi or Hinglish, Indian, British or American — and Nimantran calls your own phone with it. Not a canned sample. Your script, your number, your call.
        </PageHero>
        <div className="chip-row">
          <span className="chip">Collections</span><span className="chip">Customer service</span><span className="chip">Abandoned cart recovery</span><span className="chip">Appointment reminders</span>
        </div>

        <ProductOverview
          illo="voice"
          title="What Voice Bots do"
          lead="A Nimantran Voice Bot makes and takes phone calls in natural spoken language. You choose the script, the voice and the accent. It handles the repeatable conversations, such as reminders, payment follow-ups and order confirmations, and hands the difficult ones to your people."
          steps={OV_STEPS}
          highlights={HIGHLIGHTS}
          tryTitle="Ready to hear it?"
          tryText="Write a short script below and Nimantran calls your phone. One free trial per phone number."
          tryCta="Hear a live bot call"
          tryHref="#vb-sandbox"
        />

        <div className="sandbox" id="vb-sandbox">
          <div className="sandbox-head">
            <div>
              <h3>Try a live bot call</h3>
              <p>One free trial per phone number.</p>
            </div>
          </div>
          <VoiceWizard />
        </div>

        <Section id="voice-pricing">
          <h2>Build your plan and see what it costs.</h2>
          <p className="no-price-note">
            One-time setup covers build, testing and go-live. Select any regional languages you need beyond English &amp; Hindi, attach your scope of work, and pay online. Need a custom deal instead? <GoLink to="contact">Talk to sales</GoLink>.
          </p>

          <div className="usage-pricing-box">
            <div className="upb-badge">Usage rate — billed monthly, not part of this checkout</div>
            <h3>₹{rate2(perMin)} per minute, English &amp; Hindi included from day one</h3>
            <p style={{ fontSize: 13.5, color: 'var(--ink-soft)', margin: 0 }}>
              Every call your bot handles — inbound or outbound, English or Hindi — is billed at ₹{rate(perMin)}/minute against actual usage. Any regional language you purchase below is billed at the same flat ₹{rate(perMin)}/minute once it's live. Usage is metered and invoiced monthly, separate from the one-time setup you're configuring here.
            </p>
          </div>

          <VoiceSetupCalculator />
        </Section>

        <FaqSection items={faqs.voice} />

        <div className="cta-band">
          <div>
            <h2>Put a bot on your busiest line.</h2>
            <p>Hear one on your own phone, or book a meeting and we will script your first campaign with you.</p>
          </div>
          <div className="cta-row">
            <GoButton to="contact" className="btn">Book a meeting</GoButton>
            <GoButton to="contact" className="btn secondary">Contact us</GoButton>
          </div>
        </div>
      </div>
    </section>
  );
}
