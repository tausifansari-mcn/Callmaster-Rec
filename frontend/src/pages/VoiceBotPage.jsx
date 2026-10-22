import { useSite } from '../context/SiteContext.jsx';
import { GoLink } from '../hooks/useGoto.jsx';
import { PageHero, Section } from '../components/ui/Blocks.jsx';
import ThemeFragment from '../components/ui/ThemeFragment.jsx';
import VoiceSetupCalculator from '../components/calculators/VoiceSetupCalculator.jsx';
import VoiceWizard from '../components/wizards/VoiceWizard.jsx';
import { rate, rate2 } from '../utils/format.js';

export default function VoiceBotPage() {
  const { pricing } = useSite();
  const perMin = pricing.voiceBot.perMinuteRate;
  return (
    <section className="page active">
      <div className="container">
        <ThemeFragment name="vb-banner" />

        <PageHero eyebrow="Voice Bots" title="A bot your customers won't hang up on.">
          Pick the accent, the voice, the script — English, Hindi or Hinglish, Indian, British or American — and Nimantran calls your own phone with it. Not a canned sample. Your script, your number, your call.
        </PageHero>
        <div className="chip-row">
          <span className="chip">Collections</span><span className="chip">Customer service</span><span className="chip">Abandoned cart recovery</span><span className="chip">Appointment reminders</span>
        </div>

        <ThemeFragment name="ov-voicebot" />

        <div className="sandbox" id="vbSandbox">
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

        <ThemeFragment name="vb-media" />
        <ThemeFragment name="tail-voicebot" />
      </div>
    </section>
  );
}
