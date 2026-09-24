const svgProps = {
  viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round',
};

const ICONS = {
  audit: (<><path d="M4 19V11" /><path d="M10 19V6" /><path d="M16 19V14" /><path d="M20 19V9" /></>),
  voice: <path d="M2 13h2.5l1.5-5 3 10 2.5-13 2 8h2.5l1.5-4 2 4H22" />,
  telephony: (<><path d="M6.5 19a4 4 0 1 1 .8-7.93A5.5 5.5 0 0 1 17.9 13H18a3.5 3.5 0 0 1 0 7H6.5z" /><path d="M9.5 15.5a2.2 2.2 0 0 0 3 2.1" /></>),
  dialers: <path d="M4 5c0 8.5 6.5 15 15 15l2-3.3-5-2-2 2c-2.6-1-5.7-4.1-6.7-6.7l2-2-2-5z" />,
  'email-automation': (<><rect x="3" y="5" width="18" height="14" rx="2.5" /><path d="M3.5 6.5L12 13l8.5-6.5" /></>),
  'whatsapp-api': <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-11.7 3.7L3 20l1.1-5.2a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 1 1 17.8.5z" />,
  clap: <path d="M4 13l4 4L20 5" />,
  magic: <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6.5 6.5l2.5 2.5M15 15l2.5 2.5M6.5 17.5L9 15M15 9l2.5-2.5" />,
  reso: (<><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="4.5" /><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" /></>),
};

/** The rounded amber icon tile used on cards and page heroes. */
export function IconBadge({ name, small = false }) {
  return (
    <div className={`icon-badge${small ? ' sm' : ''}`} aria-hidden="true">
      <svg {...svgProps}>{ICONS[name]}</svg>
    </div>
  );
}
