import { useState } from 'react';

const WA_NUMBER = '919667195550';
const WA_MESSAGE = 'Hi Nimantran, I would like to know more about';
const waUrl = () => `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(`${WA_MESSAGE} (${document.title})`)}`;

/** Floating "WhatsApp us" button, bottom-left so it never sits on top of the help chat widget (bottom-right). */
export default function WhatsAppButton() {
  // The message names the current page, so refresh the link when the pointer/focus reaches it.
  const [href, setHref] = useState(waUrl);
  const refresh = () => setHref(waUrl());
  return (
    <a className="nim-wa" href={href} target="_blank" rel="noopener noreferrer" aria-label="Chat with Nimantran on WhatsApp" onMouseEnter={refresh} onFocus={refresh} onTouchStart={refresh}>
      <svg viewBox="0 0 32 32" width="28" height="28" aria-hidden="true">
        <path fill="#fff" d="M16 3C9 3 3.4 8.6 3.4 15.5c0 2.3.6 4.4 1.7 6.3L3 29l7.4-1.9a12.6 12.6 0 0 0 5.6 1.3C23 28.4 28.6 22.8 28.6 15.9S23 3 16 3zm0 23.2c-1.8 0-3.5-.5-5-1.4l-.4-.2-4.4 1.1 1.2-4.3-.3-.4a10.3 10.3 0 0 1-1.6-5.5C5.5 9.9 10.2 5.2 16 5.2s10.5 4.7 10.5 10.5S21.8 26.2 16 26.2zm5.8-7.8c-.3-.2-1.9-.9-2.2-1-.3-.1-.5-.2-.7.2-.2.3-.8 1-.9 1.2-.2.2-.3.2-.6.1a8.6 8.6 0 0 1-4.3-3.7c-.3-.6.3-.5.9-1.6.1-.2 0-.4 0-.5l-1-2.3c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.6.1-.9.4-.3.3-1.2 1.1-1.2 2.8s1.2 3.3 1.4 3.5c.2.2 2.4 3.7 5.9 5.1 2.2.9 3 1 4.1.8.7-.1 1.9-.8 2.2-1.5.3-.7.3-1.4.2-1.5-.1-.2-.3-.3-.6-.4z" />
      </svg>
      <span>WhatsApp us</span>
    </a>
  );
}
