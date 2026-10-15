import { GoButton } from '../../hooks/useGoto.jsx';
import { PRODUCT_ILLOS } from './ProductIllos.jsx';

/**
 * The "what this product does" block that opens each product page: lead copy, a numbered
 * how-it-works list, the highlight cards, and a band that points at the live demo below.
 * `tryTo` routes elsewhere; `tryHref` scrolls to a section on the same page.
 */
export default function ProductOverview({ illo, title, lead, steps, highlights, tryTitle, tryText, tryCta, tryHref, tryTo }) {
  const scrollTo = (e) => {
    e.preventDefault();
    document.querySelector(tryHref)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="ov">
      <div className="ov-top">
        {PRODUCT_ILLOS[illo] && <div className="ov-art">{PRODUCT_ILLOS[illo]}</div>}
        <div className="ov-copy">
          <h2>{title}</h2>
          <p className="ov-lead">{lead}</p>
          <h3 className="ov-sub">How it works</h3>
          <ol className="ov-steps">
            {steps.map((s) => (
              <li key={s.title}><b>{s.title}</b><span>{s.text}</span></li>
            ))}
          </ol>
        </div>
      </div>

      <h3 className="ov-h">Highlights</h3>
      <div className="ov-hl">
        {highlights.map((h) => (
          <div className="ov-card" key={h.title}>
            <h4>{h.title}</h4>
            <p>{h.text}</p>
          </div>
        ))}
      </div>

      <div className="ov-try">
        <div>
          <b>{tryTitle}</b>
          <span>{tryText}</span>
        </div>
        {tryHref
          ? <a className="btn" href={tryHref} onClick={scrollTo}>{tryCta}</a>
          : <GoButton to={tryTo} className="btn">{tryCta}</GoButton>}
      </div>
    </div>
  );
}
