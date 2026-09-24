import { IconBadge } from './Icons.jsx';
import RichText from './RichText.jsx';

/** Page hero used across product pages (the original's `.hero` with 34px top padding). */
export function PageHero({ icon, eyebrow, title, children }) {
  return (
    <div className="hero" style={{ paddingTop: 34 }}>
      {icon && <IconBadge name={icon} />}
      {eyebrow && <div className="eyebrow">{eyebrow}</div>}
      <h1>{title}</h1>
      {children && <p className="sub">{children}</p>}
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
