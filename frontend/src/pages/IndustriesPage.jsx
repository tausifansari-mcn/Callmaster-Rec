import ThemeFragment from '../components/ui/ThemeFragment.jsx';
import { industryFragment } from '../data/industryFragments.js';

/** Industries hub (/industries) — the theme's template-industries.php: `.wrap.section` + the "industries" fragment. */
export default function IndustriesPage() {
  return (
    <div className="tp-ct tp-pure">
      <div className="wrap section">
        <ThemeFragment parts={[industryFragment('industries')]} />
      </div>
    </div>
  );
}
