import { Link } from 'react-router-dom';

const TOKEN = /(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g;

function Inline({ text }) {
  return text.split(TOKEN).map((part, i) => {
    if (/^\*\*[^*]+\*\*$/.test(part)) return <b key={i}>{part.slice(2, -2)}</b>;
    const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (link) {
      const [, label, href] = link;
      return /^https?:|^mailto:/.test(href)
        ? <a key={i} href={href} target="_blank" rel="noreferrer">{label}</a>
        : <Link key={i} to={href}>{label}</Link>;
    }
    return part;
  });
}

/**
 * Minimal, safe markup for admin-edited copy: blank line = new paragraph, **bold**, [label](/path).
 * Anything else is rendered as plain text (never as HTML).
 */
export default function RichText({ text = '', inline = false }) {
  if (inline) return <Inline text={String(text)} />;
  return String(text)
    .split(/\n{2,}/)
    .filter((p) => p.trim())
    .map((p, i) => (
      <p key={i}><Inline text={p.trim()} /></p>
    ));
}
