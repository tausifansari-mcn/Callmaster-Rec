import { useEffect, useRef } from 'react';

/** Four single-digit boxes with auto-advance, backspace-to-previous and paste support. */
export default function OtpInput({ value, onChange, onEnter, length = 4 }) {
  const refs = useRef([]);
  const digits = Array.from({ length }, (_, i) => value[i] || '');

  useEffect(() => { refs.current[0]?.focus(); }, []);

  const setAt = (i, ch) => {
    const next = digits.slice();
    next[i] = ch;
    onChange(next.join(''));
  };

  return (
    <div className="otp-boxes">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          value={d}
          maxLength={1}
          inputMode="numeric"
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          onChange={(e) => {
            const ch = e.target.value.replace(/[^0-9]/g, '').slice(-1);
            setAt(i, ch);
            if (ch && refs.current[i + 1]) refs.current[i + 1].focus();
          }}
          onKeyDown={(e) => {
            if (e.key === 'Backspace' && !d && refs.current[i - 1]) refs.current[i - 1].focus();
            if (e.key === 'Enter' && onEnter) onEnter();
          }}
          onPaste={(e) => {
            const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
            if (!pasted) return;
            e.preventDefault();
            onChange(pasted);
            refs.current[Math.min(pasted.length, length - 1)]?.focus();
          }}
        />
      ))}
    </div>
  );
}
