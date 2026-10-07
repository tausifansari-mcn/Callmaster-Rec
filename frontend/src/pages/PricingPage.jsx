import { useSite } from '../context/SiteContext.jsx';
import { GoButton, GoLink } from '../hooks/useGoto.jsx';
import { PageHero, Section } from '../components/ui/Blocks.jsx';
import { money, rate } from '../utils/format.js';

export default function PricingPage() {
  const { pricing } = useSite();
  const { telephony, voiceBot } = pricing;

  return (
    <section className="page active">
      <div className="container">
        <PageHero eyebrow="Pricing" title="Clear prices for Cloud Telephony and Voice Bots. Audits and SIP are quoted.">
          Cloud Telephony and Voice Bot prices are final — configure and pay online. Quality Audits, SIP Channels and Social Listening are quoted to your volume.
        </PageHero>
        <div className="legal-note">Online self-serve checkout is live for Cloud Telephony and Voice Bots below. For Quality Audits, SIP Channels and Social Listening, send a request and our team sets up billing directly — no change to the plans, rates or trial experience.</div>

        <Section style={{ paddingTop: 0 }}>
          <h3 style={{ fontSize: 18, marginBottom: 10 }}>Quality Audits</h3>
          <div className="two-col" style={{ marginBottom: 14 }}>
            <div>
              <span className="tier-label license">License-wise</span>
              <table className="pricing-table">
                <thead><tr><th>Plan</th><th>Included volume</th><th>Price</th></tr></thead>
                <tbody>
                  <tr><td>Starter</td><td>Up to 2,000 calls / month</td><td><span className="tbc">Pricing to be confirmed</span></td></tr>
                  <tr><td>Growth</td><td>Up to 10,000 calls / month</td><td><span className="tbc">Pricing to be confirmed</span></td></tr>
                  <tr><td>Enterprise</td><td>Custom volume</td><td className="num">Quoted</td></tr>
                </tbody>
              </table>
            </div>
            <div>
              <span className="tier-label minute">Per-minute</span>
              <table className="pricing-table">
                <thead><tr><th>Usage band</th><th>Rate</th></tr></thead>
                <tbody>
                  <tr><td>Pay-as-you-go</td><td><span className="tbc">Pricing to be confirmed</span></td></tr>
                  <tr><td>Volume discount (5,000+ min/month)</td><td><span className="tbc">Pricing to be confirmed</span></td></tr>
                </tbody>
              </table>
            </div>
          </div>
          <div className="cta-row" style={{ marginBottom: 36 }}><GoButton to="audit" anchor="audit-pricing" className="btn">Request this plan</GoButton></div>

          <h3 style={{ fontSize: 18, marginBottom: 10 }}>Voice Bots</h3>
          <table className="pricing-table" style={{ marginBottom: 14 }}>
            <thead><tr><th>Item</th><th>Price</th></tr></thead>
            <tbody>
              <tr><td>Per minute, English, Hindi and Hinglish</td><td className="num">from ₹{rate(voiceBot.perMinuteRate)}</td></tr>
              <tr><td>One-time setup</td><td className="num">{money(voiceBot.setupFee)}</td></tr>
              <tr><td>Each regional Indian language (one time)</td><td className="num">{money(voiceBot.languageFee)}</td></tr>
              <tr><td>Enterprise volume</td><td className="num">Quoted</td></tr>
            </tbody>
          </table>
          <p style={{ fontSize: 13, color: 'var(--ink-faint)', margin: '0 0 14px' }}>Prices exclude GST. Paying your current vendor less? Tell us on the quote form and see if we can match it.</p>
          <div className="cta-row" style={{ marginBottom: 36 }}><GoLink to="voice" anchor="voice-pricing" className="btn">Get a voice bot quote</GoLink></div>

          <h3 style={{ fontSize: 18, marginBottom: 10 }}>Cloud Telephony</h3>
          <table className="pricing-table" style={{ marginBottom: 14 }}>
            <thead><tr><th>Item</th><th>Price</th></tr></thead>
            <tbody>
              <tr><td>User licence</td><td className="num">{money(telephony.licenseRate)} / user / month</td></tr>
              <tr><td>Extra channel</td><td className="num">{money(telephony.channelRate)} / channel / month</td></tr>
              <tr><td>Extra number (DID)</td><td className="num">{money(telephony.didRate)} / number / month</td></tr>
            </tbody>
          </table>
          <p style={{ fontSize: 13, color: 'var(--ink-faint)', margin: '0 0 14px' }}>Prices exclude GST. Lines are issued as mobile look-alike numbers. New customers get 2% of their calls audited free in the first month, and can cancel within 3 days for a full refund.</p>
          <div className="cta-row" style={{ marginBottom: 36 }}><GoLink to="telephony" anchor="telephony-pricing" className="btn">Configure Cloud Telephony</GoLink></div>

          <div className="two-col">
            <div className="insight-card">
              <h4 style={{ marginBottom: 6 }}>SIP Channels</h4>
              <p style={{ fontSize: 13.5, marginBottom: 12 }}>No listed rate — tell us your channel count and we'll send a quote.</p>
              <GoLink to="sip-channels" className="btn secondary">Get pricing</GoLink>
            </div>
            <div className="insight-card">
              <h4 style={{ marginBottom: 6 }}>Social Listening</h4>
              <p style={{ fontSize: 13.5, marginBottom: 12 }}>Pricing model still being finalized.</p>
              <GoLink to="contact" className="btn secondary">Talk to sales</GoLink>
            </div>
          </div>
        </Section>

        <Section style={{ paddingTop: 0 }}>
          <h2>Enterprise tier</h2>
          <p className="table-scroll-hint">&larr; swipe to see all columns &rarr;</p>
          <div className="table-scroll">
            <table className="pricing-table">
              <thead><tr><th></th><th>Standard</th><th>Enterprise</th></tr></thead>
              <tbody>
                <tr><td>Pricing</td><td>Pay-as-you-go, quoted to your volume</td><td>Custom, volume-based contract</td></tr>
                <tr><td>Onboarding</td><td>Self-serve</td><td>Dedicated onboarding &amp; integration support</td></tr>
                <tr><td>Support</td><td>Email/chat support</td><td>Dedicated account manager, SLA-backed</td></tr>
                <tr><td>Customization</td><td>Standard options</td><td>Custom scripts, voice cloning, scoring parameters</td></tr>
                <tr><td>Ideal for</td><td>Small teams, pilots</td><td>BPOs, enterprises, high-volume operations</td></tr>
              </tbody>
            </table>
          </div>
          <GoButton to="contact" className="btn">Talk to Enterprise Sales</GoButton>
        </Section>
      </div>
    </section>
  );
}
