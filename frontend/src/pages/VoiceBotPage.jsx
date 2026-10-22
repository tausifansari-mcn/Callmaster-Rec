import ThemeFragment from '../components/ui/ThemeFragment.jsx';
import VoiceSetupCalculator, { VoiceQuoteIntro } from '../components/calculators/VoiceSetupCalculator.jsx';
import VoiceWizard from '../components/wizards/VoiceWizard.jsx';

/** Voice Bots — transcribed from the theme's template-voice-bots.php. */
export default function VoiceBotPage() {
  return (
    <section className="wrap section pp pp-voice">
      <ThemeFragment name="vb-banner" />
      <div className="section-head">
        <div className="kicker">Voice Bots</div>
        <h1>A bot your customers won&apos;t hang up on.</h1>
        <p>Pick the accent, the voice, the script — English, Hindi or Hinglish, Indian, British or American — and Nimantran calls your own phone with it. Not a canned sample. Your script, your number, your call.</p>
        <div className="chip-row"><span className="chip">Collections</span><span className="chip">Customer service</span><span className="chip">Abandoned cart recovery</span><span className="chip">Appointment reminders</span></div>
      </div>

      <ThemeFragment name="ov-voicebot" />

      <div className="sandbox" id="vbSandbox">
        <div className="sandbox-head">
          <div><h3>Try a live bot call</h3><p style={{ margin: '6px 0 0', fontSize: 13 }}>One free trial per phone number.</p></div>
        </div>
        <VoiceWizard />
      </div>
      {/* Zero-size alias so existing "#voice-pricing" links (admin CTAs) still land on the quote builder. */}
      <div id="voice-pricing" aria-hidden="true" />
      <div className="vbq-wrap" id="vbq">
        <VoiceQuoteIntro />
        <VoiceSetupCalculator />
      </div>
      <ThemeFragment name="vb-media" />
      <ThemeFragment name="tail-voicebot" />
    </section>
  );
}
