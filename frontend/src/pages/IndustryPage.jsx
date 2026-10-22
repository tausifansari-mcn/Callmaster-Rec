import { useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { publicApi } from '../api/public.js';
import ThemeFragment from '../components/ui/ThemeFragment.jsx';
import { industryFragment } from '../data/industryFragments.js';
import { getIndustryBySlug } from '../data/industries.js';
import { isOfficialEmail } from '../utils/validators.js';
import { NotFoundPage } from './DynamicPage.jsx';

// Same checks and copy as the theme's assets/js/industries.js.
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE = /^(\+?91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}$/;

/**
 * One industry page (/industries/:slug) — the theme's template-industry.php: `.wrap.section` + the
 * "ind-<slug>" fragment, verbatim. The fragment's email + mobile lead form is wired to the backend here.
 */
export default function IndustryPage() {
  const { slug } = useParams();
  const industry = getIndustryBySlug(slug);
  const html = industry ? industryFragment(`ind-${slug}`) : null;
  const root = useRef(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return undefined;
    const onClick = async (e) => {
      // In-page anchors ("Get in touch" → #ind-form-…) scroll without a router navigation.
      const hash = e.target.closest?.('a[href^="#"]');
      if (hash) {
        const target = document.getElementById(hash.getAttribute('href').slice(1));
        if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
        return;
      }
      const b = e.target.closest?.('.ind-send');
      const f = b?.closest('.ind-form');
      if (!f) return;
      e.preventDefault();
      const em = f.querySelector('input[type=email]');
      const ph = f.querySelector('input[type=tel]');
      const err = f.querySelector('.ind-err');
      const hp = f.querySelector('.ind-hp');
      const ok = f.querySelector('.ind-ok');
      const email = em.value.trim();
      const phone = ph.value.replace(/[\s-]/g, '').slice(-10);
      const fail = (msg, input) => { err.textContent = msg; err.style.display = 'block'; input?.focus(); };
      if (!EMAIL.test(email)) return fail('Enter a valid work email, for example you@company.com.', em);
      if (!isOfficialEmail(email)) return fail('Enter your work email. Personal addresses (Gmail, Yahoo, etc.) are not accepted.', em);
      if (!PHONE.test(ph.value.trim())) return fail('Enter a valid 10-digit Indian mobile number.', ph);
      err.style.display = 'none';
      if (hp?.value) { ok.style.display = 'block'; return; }
      b.disabled = true;
      try {
        // The backend's contact record needs a name and organisation; this short form only asks for email and
        // mobile (as on the theme), so they are taken from the work email.
        const [local, domain] = email.split('@');
        await publicApi.contact({
          name: local,
          organization: domain,
          email,
          phone,
          interest: 'Enterprise',
          message: `Industry page lead: ${f.getAttribute('data-industry')}`,
        });
        ok.style.display = 'block';
        b.style.display = 'none';
        em.disabled = true;
        ph.disabled = true;
      } catch (ex) {
        fail(ex.message || 'Something went wrong. Please try again.');
        b.disabled = false;
      }
      return undefined;
    };
    el.addEventListener('click', onClick);
    return () => el.removeEventListener('click', onClick);
  }, [html]);

  if (!html) return <NotFoundPage />;

  return (
    <div className="tp-ct tp-pure">
      <div className="wrap section" ref={root}>
        <ThemeFragment key={slug} parts={[html]} />
      </div>
    </div>
  );
}
