import { useSite } from '../context/SiteContext.jsx';
import { GoLink } from '../hooks/useGoto.jsx';
import { FaqSection, HowSteps, PageHero, Section } from '../components/ui/Blocks.jsx';
import VoiceSetupCalculator from '../components/calculators/VoiceSetupCalculator.jsx';
import VoiceWizard from '../components/wizards/VoiceWizard.jsx';
import { rate, rate2 } from '../utils/format.js';

export default function VoiceBotPage() {
  const { pricing, faqs } = useSite();
  const perMin = pricing.voiceBot.perMinuteRate;
  return (
    <section className="page active">
      <div className="container">
        <PageHero icon="voice" illo="voice" eyebrow="Voice Bots" title="A bot your customers won't hang up on.">
          Pick the accent, the voice, the script — English, Hindi or Hinglish, Indian, British or American — and Nimantran calls your own phone with it. Not a canned sample. Your script, your number, your call.
        </PageHero>
        <div className="chip-row">
          <span className="chip">Collections</span><span className="chip">Customer service</span><span className="chip">Abandoned cart recovery</span><span className="chip">Appointment reminders</span>
        </div>

        <Section style={{ paddingTop: 0 }}>
          <h2>How it works</h2>
          <HowSteps steps={[
            { art: 'lines-b', title: 'Choose industry & call type', text: 'Inbound, Outbound, Collections, Abandoned Cart Recovery, and more.' },
            { art: 'mic', title: 'Pick a voice & language', text: 'Male or female, then English, Hindi, Hinglish, British or American English.' },
            { art: 'check', title: 'Verify & get the call', text: 'Enter your number, verify with OTP, and hit Call Me.' },
          ]} />
        </Section>

        <VoiceWizard />

        <Section id="voice-pricing">
          <h2>Setup &amp; self-serve checkout</h2>
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
      </div>
    </section>
  );
}
