import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useSite } from '../../context/SiteContext.jsx';
import { useGoto } from '../../hooks/useGoto.jsx';
import { usePurchase } from '../purchase/PurchaseContext.jsx';
import { resolvePriceTokens } from '../../utils/tokens.js';

/** Rule-based helpline bot. Rules, greeting and quick replies come from the admin panel (Chatbot). */
function findRule(text, rules) {
  const lower = text.toLowerCase();
  for (const rule of rules) {
    if (rule.keywords.some((k) => lower.includes(k.toLowerCase()))) return rule;
    if (rule.pattern) {
      try {
        const hit = new RegExp(rule.pattern, 'i').test(lower);
        const excluded = rule.excludePattern && new RegExp(rule.excludePattern, 'i').test(lower);
        if (hit && !excluded) return rule;
      } catch { /* an invalid admin-entered pattern is skipped */ }
    }
  }
  return null;
}

export default function ChatWidget() {
  const { chatbot, pricing, site } = useSite();
  const goto = useGoto();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const bodyRef = useRef(null);
  const started = useRef(false);
  const { isOpen: checkoutOpen } = usePurchase();
  const { pathname } = useLocation();
  const openRef = useRef(false);
  const checkoutRef = useRef(false);
  const nudged = useRef(false);
  openRef.current = open;
  checkoutRef.current = checkoutOpen;

  // Proactive nudge: if someone has been idle on a page, gently offer help — once per page, never over the checkout or an open chat.
  const nudge = chatbot.nudge;
  useEffect(() => {
    nudged.current = false; // a new page gets its own nudge
    if (!nudge?.enabled || !nudge.messages?.length) return undefined;
    let timer;
    const schedule = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        if (checkoutRef.current || openRef.current || nudged.current) return schedule();
        nudged.current = true;
        started.current = true;
        setOpen(true);
        setMessages((m) => [...m, { who: 'bot', text: nudge.messages[Math.floor(Math.random() * nudge.messages.length)] }]);
        return undefined;
      }, Math.max(5, nudge.idleSeconds) * 1000);
    };
    const events = ['mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
    events.forEach((evt) => document.addEventListener(evt, schedule, { passive: true }));
    schedule();
    return () => {
      clearTimeout(timer);
      events.forEach((evt) => document.removeEventListener(evt, schedule));
    };
  }, [pathname, nudge]);

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [messages, open]);

  const toggle = () => {
    if (open) return setOpen(false);
    setOpen(true);
    if (!started.current) {
      started.current = true;
      setMessages([{ who: 'bot', text: chatbot.greeting }]);
    }
    return undefined;
  };

  const send = (raw) => {
    const text = raw.trim();
    if (!text) return;
    setMessages((m) => [...m, { who: 'user', text }]);
    setInput('');
    const rule = findRule(text, chatbot.rules);
    setTimeout(() => {
      setMessages((m) => [
        ...m,
        rule
          ? { who: 'bot', text: resolvePriceTokens(rule.reply, { ...pricing, site }), cta: rule.target ? { to: rule.target, anchor: rule.anchor, label: rule.label } : null }
          : { who: 'bot', text: chatbot.fallback, cta: { to: 'contact', label: 'Go to Contact' } },
      ]);
    }, 350);
  };

  const followCta = (e, cta) => {
    e.preventDefault();
    setOpen(false);
    goto(cta.to, cta.anchor || undefined);
  };

  // Markup and classes follow the theme's help chat (assets/js/chatbot.js); the replies come from the admin panel.
  return (
    <div className={`nc-root${open ? ' nc-open' : ''}`}>
      <div className="nc-pop" role="dialog" aria-label="Nimantran help" hidden={!open}>
        <div className="nc-head">
          <div>
            <div className="nc-title">Nimantran help</div>
            <div className="nc-sub">Ask me anything, or pick a topic</div>
          </div>
          <button type="button" className="nc-x" aria-label="Close help chat" onClick={() => setOpen(false)}>&times;</button>
        </div>
        <div className="nc-body" ref={bodyRef} aria-live="polite">
          {messages.map((m, i) => (
            <div key={i} style={{ display: 'contents' }}>
              <div className={`nc-msg ${m.who === 'user' ? 'nc-me' : 'nc-bot'}`}>{m.text}</div>
              {m.cta && (
                <div className="nc-go">
                  <button type="button" className="nc-gobtn" onClick={(e) => followCta(e, m.cta)}>{m.cta.label || 'Take me there'}</button>
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="nc-chips">
          {started.current && chatbot.quickReplies.map((q) => (
            <button type="button" className="nc-chip" key={q} onClick={() => send(q)}>{q}</button>
          ))}
        </div>
        <form className="nc-form" onSubmit={(e) => { e.preventDefault(); send(input); }}>
          <input
            type="text"
            value={input}
            placeholder="Type your question"
            aria-label="Type your question"
            maxLength={200}
            autoComplete="off"
            onChange={(e) => setInput(e.target.value)}
          />
          <button type="submit">Send</button>
        </form>
      </div>
      <button type="button" className="nc-fab" aria-label="Open help chat" aria-expanded={open} onClick={toggle}>
        <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 5h16v11H9l-5 4z" /></svg>
      </button>
    </div>
  );
}
