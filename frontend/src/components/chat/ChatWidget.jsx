import { useEffect, useRef, useState } from 'react';
import { useSite } from '../../context/SiteContext.jsx';
import { useGoto } from '../../hooks/useGoto.jsx';
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
  const { chatbot, pricing } = useSite();
  const goto = useGoto();
  const [visible, setVisible] = useState(false);
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const bodyRef = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    const onScroll = () => { if (window.scrollY > 250) { setVisible(true); window.removeEventListener('scroll', onScroll); } };
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

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
          ? { who: 'bot', text: resolvePriceTokens(rule.reply, pricing), cta: rule.target ? { to: rule.target, anchor: rule.anchor, label: rule.label } : null }
          : { who: 'bot', text: chatbot.fallback, cta: { to: 'contact', label: 'Go to Contact' } },
      ]);
    }, 350);
  };

  const followCta = (e, cta) => {
    e.preventDefault();
    setOpen(false);
    goto(cta.to, cta.anchor || undefined);
  };

  return (
    <>
      <button type="button" className={`chat-bubble${visible ? ' visible' : ''}`} aria-label="Chat" onClick={toggle}>💬</button>

      <div className={`chat-panel${open ? ' open' : ''}`} role="dialog" aria-label="CallMaster helpline chat">
        <div className="chat-head">
          <div>
            <div className="chat-head-title">CallMaster Helpline</div>
            <div className="chat-head-sub">Usually replies instantly · sandbox bot</div>
          </div>
          <button type="button" className="chat-close-btn" aria-label="Close chat" onClick={() => setOpen(false)}>&times;</button>
        </div>
        <div className="chat-body" ref={bodyRef}>
          {messages.map((m, i) => (
            <div key={i} className={`chat-msg ${m.who}`}>
              {m.text}
              {m.cta && (
                <> <a href="#" onClick={(e) => followCta(e, m.cta)}>{m.cta.label || 'Take me there'} →</a></>
              )}
            </div>
          ))}
        </div>
        <div className="chat-quick-replies">
          {started.current && chatbot.quickReplies.map((q) => (
            <button type="button" key={q} onClick={() => send(q)}>{q}</button>
          ))}
        </div>
        <div className="chat-input-row">
          <input
            type="text"
            value={input}
            placeholder="Ask about pricing, products, refunds…"
            autoComplete="off"
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') send(input); }}
          />
          <button type="button" aria-label="Send" onClick={() => send(input)}>➤</button>
        </div>
      </div>
    </>
  );
}
