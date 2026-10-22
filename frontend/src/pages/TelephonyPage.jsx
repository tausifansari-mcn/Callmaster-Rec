import ThemeFragment from '../components/ui/ThemeFragment.jsx';
import TelephonyCalculator from '../components/calculators/TelephonyCalculator.jsx';
import { Link } from 'react-router-dom';
import { pathFor } from '../utils/routes.js';

const icon = { viewBox: '0 0 24 24', width: 20, height: 20, fill: 'none', stroke: '#fff', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' };

/** Cloud Telephony — transcribed from the theme's template-cloud-telephony.php. */
export default function TelephonyPage() {
  return (
    <div className="wrap section pp pp-telephony">
      <ThemeFragment name="ct-banner" />
      <div className="section-head">
        <div className="kicker">Cloud Telephony</div>
        <h1>Call from a number that looks like a mobile.</h1>
        <p>Nimantran Cloud Telephony gives every agent a cloud calling line with a mobile-style number. Your customers see a number that looks like any other mobile, not an unfamiliar landline or service series.</p>
        <ul className="feat-row">
          <li className="feat feat-hero"><span className="feat-ic" aria-hidden="true"><svg {...icon}><rect x="7" y="2" width="10" height="20" rx="2" /><path d="M11 18h2" /></svg></span><span>Mobile look-alike number</span></li>
          <li className="feat"><span className="feat-ic" aria-hidden="true"><svg {...icon}><circle cx="12" cy="8" r="3.5" /><path d="M5 21c0-4 3-6.5 7-6.5s7 2.5 7 6.5" /></svg></span><span>Pay per user</span></li>
          <li className="feat"><span className="feat-ic" aria-hidden="true"><svg {...icon}><path d="M12 5v14M5 12h14" /></svg></span><span>Add channels and numbers as you grow</span></li>
        </ul>
      </div>

      <ThemeFragment name="ov-telephony" />

      <div className="usp-band">
        <div>
          <h2>The number that looks like a mobile.</h2>
          <p>Most business calls come from numbers people ignore. Cloud Telephony lines are issued as mobile-style numbers, so your calls look personal from the first ring.</p>
        </div>
        <ul>
          <li>One licence per agent, billed monthly</li>
          <li>Add concurrent channels when call volume grows</li>
          <li>Add extra numbers (DIDs) for teams or campaigns</li>
        </ul>
      </div>

      <ThemeFragment name="ct-media" />

      <div className="offer-card">
        <div className="offer-badge">Welcome offer</div>
        <h2>2% of your calls audited free in your first month.</h2>
        <p>New Cloud Telephony customers get Nimantran Quality Audits on 2% of their calls for the first month. We share the results with you, at no extra charge.</p>
      </div>

      <ThemeFragment name="ct-strip" />

      {/* Zero-size alias so existing "#telephony-pricing" links still land on the configurator. */}
      <div id="telephony-pricing" aria-hidden="true" />
      <h2 className="block-title" id="ct-config">Choose your setup</h2>
      <TelephonyCalculator />

      <p className="ct-foot">Prices exclude GST. Need many seats, or a setup that isn&apos;t listed here? <Link to={`${pathFor('contact')}?interest=Cloud%20Telephony`}>Talk to sales</Link>.</p>
      <ThemeFragment name="tail-telephony" />
    </div>
  );
}
