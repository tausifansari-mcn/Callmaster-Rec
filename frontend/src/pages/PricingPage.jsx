import { Link } from 'react-router-dom';
import { useSite } from '../context/SiteContext.jsx';
import { GoLink } from '../hooks/useGoto.jsx';
import ThemeFragment from '../components/ui/ThemeFragment.jsx';
import { pathFor } from '../utils/routes.js';

/** Same output as the theme's nimantran_inr(): ₹ + thousands separators, 2 decimals only when fractional. */
const inr = (n) => {
  const v = Number(n);
  const whole = Math.floor(v) === v;
  return `₹${v.toLocaleString('en-US', { minimumFractionDigits: whole ? 0 : 2, maximumFractionDigits: whole ? 0 : 2 })}`;
};

const contactFor = (interest) => `${pathFor('contact')}?interest=${encodeURIComponent(interest)}`;

export default function PricingPage() {
  const { pricing } = useSite();
  const { telephony, voiceBot } = pricing;

  return (
    <>
      {/* Direct child of <main>, like WP, so the theme's `main#main>.wrap.section` hero band applies. */}
      <section className="wrap section pc-page">
        <div className="section-head">
          <div className="kicker">Pricing</div>
          <h1>Clear prices for Cloud Telephony and Voice Bots. Audits and SIP are quoted.</h1>
          <p>Cloud Telephony and Voice Bot prices are final. Quality Audits pricing is still being confirmed.</p>
          <div className="legal-note" style={{ marginTop: 14 }}>Online self-serve checkout is being finalized. Choose a plan below and our team will set up billing with you directly (invoice or bank transfer) — no change to the plans, rates or trial experience above.</div>
        </div>

        <h3 style={{ fontSize: 18, marginBottom: 10 }}>Quality Audits</h3>
        <div className="two-col" style={{ marginBottom: 14 }}>
          <div>
            <span className="tier-label tier-license">License-wise</span>
            <table className="price-table">
              <tbody>
                <tr><th>Plan</th><th>Included volume</th><th>Price</th></tr>
                <tr><td>Starter</td><td>Up to 2,000 calls / month</td><td><span className="tbc">Pricing to be confirmed</span></td></tr>
                <tr><td>Growth</td><td>Up to 10,000 calls / month</td><td><span className="tbc">Pricing to be confirmed</span></td></tr>
                <tr><td>Enterprise</td><td>Custom volume</td><td className="num">Quoted</td></tr>
              </tbody>
            </table>
          </div>
          <div>
            <span className="tier-label tier-minute">Per-minute</span>
            <table className="price-table">
              <tbody>
                <tr><th>Usage band</th><th>Rate</th></tr>
                <tr><td>Pay-as-you-go</td><td><span className="tbc">Pricing to be confirmed</span></td></tr>
                <tr><td>Volume discount (5,000+ min/month)</td><td><span className="tbc">Pricing to be confirmed</span></td></tr>
              </tbody>
            </table>
          </div>
        </div>
        <div className="hero-cta" style={{ marginBottom: 36 }}>
          <Link className="btn btn-primary" to={contactFor('Quality Audits')}>Request this plan</Link>
        </div>

        <h3 style={{ fontSize: 18, marginBottom: 10 }}>Voice Bots</h3>
        <table className="price-table" style={{ marginBottom: 14 }}>
          <tbody>
            <tr><th>Item</th><th>Price</th></tr>
            <tr><td>Per minute, English, Hindi and Hinglish</td><td className="num">from {inr(voiceBot.perMinuteRate)}</td></tr>
            <tr><td>One-time setup</td><td className="num">{inr(voiceBot.setupFee)}</td></tr>
            <tr><td>Each regional Indian language (one time)</td><td className="num">{inr(voiceBot.languageFee)}</td></tr>
            <tr><td>Enterprise volume</td><td className="num">Quoted</td></tr>
          </tbody>
        </table>
        <p style={{ fontSize: 13, color: 'var(--muted)', margin: '0 0 14px' }}>Prices exclude GST. Paying your current vendor less? Tell us on the quote form and see if we can match it.</p>
        <div className="hero-cta" style={{ marginBottom: 36 }}><GoLink to="voice" anchor="voice-pricing" className="btn btn-primary">Get a voice bot quote</GoLink></div>

        <h3 style={{ fontSize: 18, marginBottom: 10 }}>Cloud Telephony</h3>
        <table className="price-table" style={{ marginBottom: 14 }}>
          <tbody>
            <tr><th>Item</th><th>Price</th></tr>
            <tr><td>User licence</td><td className="num">{inr(telephony.licenseRate)} / user / month</td></tr>
            <tr><td>Extra channel</td><td className="num">{inr(telephony.channelRate)} / channel / month</td></tr>
            <tr><td>Extra number (DID)</td><td className="num">{inr(telephony.didRate)} / number / month</td></tr>
          </tbody>
        </table>
        <p style={{ fontSize: 13, color: 'var(--muted)', margin: '0 0 14px' }}>Prices exclude GST. Lines are issued as mobile look-alike numbers. New customers get 2% of their calls audited free in the first month, and can cancel within 3 days for a full refund.</p>
        <div className="hero-cta" style={{ marginBottom: 36 }}><GoLink to="telephony" className="btn btn-primary">Configure Cloud Telephony</GoLink></div>

        <div className="two-col">
          <div className="insight-card">
            <h4 style={{ marginBottom: 6 }}>SIP Channels</h4>
            <p style={{ fontSize: 13.5, marginBottom: 12 }}>No listed rate — tell us your channel count and we'll send a quote.</p>
            <GoLink to="sip-channels" className="btn btn-outline">Get pricing</GoLink>
          </div>
          <div className="insight-card">
            <h4 style={{ marginBottom: 6 }}>Social Listening</h4>
            <p style={{ fontSize: 13.5, marginBottom: 12 }}>Pricing model still being finalized.</p>
            <Link className="btn btn-outline" to={contactFor('Social Listening')}>Talk to sales</Link>
          </div>
        </div>
      </section>

      <div className="pc-page" style={{ display: 'contents' }}>
        <ThemeFragment name="explore" />
      </div>
    </>
  );
}
