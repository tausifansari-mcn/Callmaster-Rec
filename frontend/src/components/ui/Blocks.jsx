import { IconBadge } from './Icons.jsx';
import { HeroIllo, HowStep } from './Illustrations.jsx';
import RichText from './RichText.jsx';

/** Page hero used across product pages (the original's `.hero` with 34px top padding). `illo` adds the picture beside the headline. */
export function PageHero({ icon, eyebrow, title, illo, children }) {
  const copy = (
    <>
      {icon && <IconBadge name={icon} />}
      {eyebrow && <div className="eyebrow">{eyebrow}</div>}
      <h1>{title}</h1>
      {children && <p className="sub">{children}</p>}
    </>
  );
  return (
    <div className="hero" style={{ paddingTop: 34 }}>
      {illo ? <div className="hero-grid"><div className="hero-copy">{copy}</div><HeroIllo kind={illo} /></div> : copy}
    </div>
  );
}

/** Icon + heading + one-line text cards ("What you get", "Why teams switch"). items: [{ icon, title, text }] */
export function BenefitGrid({ items }) {
  return (
    <div className="benefit-grid">
      {items.map((it) => (
        <div className="benefit-card" key={it.title}>
          <IconBadge name={it.icon} />
          <h4>{it.title}</h4>
          <p>{it.text}</p>
        </div>
      ))}
    </div>
  );
}

/** Three illustrated steps. steps: [{ art, title, text }] */
export function HowSteps({ steps }) {
  return (
    <div className="how-steps">
      {steps.map((s, i) => <HowStep key={s.title} art={s.art} n={i + 1} title={s.title}>{s.text}</HowStep>)}
    </div>
  );
}

export function Section({ id, children, style, className = '' }) {
  return (
    <div className={`section${className ? ` ${className}` : ''}`} id={id} style={style}>
      {children}
    </div>
  );
}

export function BulletList({ items }) {
  return <ul className="bullet-list">{items.map((it, i) => <li key={i}>{it}</li>)}</ul>;
}

export function FaqSection({ items = [] }) {
  if (!items.length) return null;
  return (
    <Section>
      <h2>FAQ</h2>
      {items.map((f, i) => (
        <details className="faq-item" key={i}>
          <summary>{f.q}</summary>
          <RichText text={f.a} />
        </details>
      ))}
    </Section>
  );
}

/** Shows the admin-configured value, or the original "[placeholder]" styling while it is still unset. */
export function Placeholder({ value, fallback }) {
  return value ? <>{value}</> : <span className="legal-placeholder">{fallback}</span>;
}
