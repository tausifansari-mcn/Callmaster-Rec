/**
 * A small schema-driven form used by every settings screen (pricing, home copy, FAQs, chatbot…).
 *
 * Field specs:
 *   { type: 'text' | 'textarea' | 'number' | 'boolean' | 'select' | 'csv', key, label, hint, options?, rows?, prefix? }
 *   { type: 'group',   key, label, fields: [...] }                                  nested object
 *   { type: 'strings', key, label, hint, addLabel }                                  array of strings
 *   { type: 'list',    key, label, hint, fields: [...], itemTitle(item, i), newItem(), addLabel }   array of objects
 */

const setIn = (obj, key, val) => ({ ...obj, [key]: val });

function Label({ spec }) {
  return (
    <>
      <label className="adm-label">{spec.label}</label>
      {spec.hint && <div className="adm-hint">{spec.hint}</div>}
    </>
  );
}

function Scalar({ spec, value, onChange }) {
  const v = value ?? '';
  switch (spec.type) {
    case 'textarea':
      return <textarea className="adm-input" rows={spec.rows || 4} value={v} onChange={(e) => onChange(e.target.value)} />;
    case 'number':
      return (
        <div className="adm-input-wrap">
          {spec.prefix && <span className="adm-prefix">{spec.prefix}</span>}
          <input
            className="adm-input"
            type="number"
            step={spec.step || 'any'}
            min={spec.min ?? 0}
            value={v}
            onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))}
          />
          {spec.suffix && <span className="adm-suffix">{spec.suffix}</span>}
        </div>
      );
    case 'select':
      return (
        <select className="adm-input" value={v} onChange={(e) => onChange(e.target.value)}>
          {spec.options.map((o) => {
            const opt = typeof o === 'string' ? { value: o, label: o } : o;
            return <option key={opt.value} value={opt.value}>{opt.label}</option>;
          })}
        </select>
      );
    case 'boolean':
      return (
        <label className="adm-switch">
          <input type="checkbox" checked={Boolean(value)} onChange={(e) => onChange(e.target.checked)} />
          <span>{spec.switchLabel || 'Enabled'}</span>
        </label>
      );
    case 'password':
      return <input className="adm-input" type="password" autoComplete="new-password" placeholder={spec.placeholder} value={v} onFocus={(e) => { if (String(v).startsWith('********')) e.target.select(); }} onChange={(e) => onChange(e.target.value)} />;
    case 'csv':
      return (
        <input
          className="adm-input"
          type="text"
          placeholder={spec.placeholder}
          value={Array.isArray(value) ? value.join(', ') : ''}
          onChange={(e) => onChange(e.target.value.split(',').map((s) => s.trimStart()))}
          onBlur={(e) => onChange(e.target.value.split(',').map((s) => s.trim()).filter(Boolean))}
        />
      );
    default:
      return <input className="adm-input" type="text" placeholder={spec.placeholder} value={v} onChange={(e) => onChange(e.target.value)} />;
  }
}

function Strings({ spec, value = [], onChange }) {
  const update = (i, v) => onChange(value.map((x, idx) => (idx === i ? v : x)));
  return (
    <div>
      <Label spec={spec} />
      <div className="adm-strings">
        {value.map((s, i) => (
          <div className="adm-string-row" key={i}>
            <input className="adm-input" type="text" value={s} onChange={(e) => update(i, e.target.value)} />
            <button type="button" className="adm-icon-btn danger" aria-label="Remove" onClick={() => onChange(value.filter((_, idx) => idx !== i))}>&times;</button>
          </div>
        ))}
      </div>
      <button type="button" className="adm-btn small" onClick={() => onChange([...value, ''])}>+ {spec.addLabel || 'Add'}</button>
    </div>
  );
}

function List({ spec, value = [], onChange }) {
  const move = (i, dir) => {
    const j = i + dir;
    if (j < 0 || j >= value.length) return;
    const next = value.slice();
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  return (
    <div>
      <Label spec={spec} />
      <div className="adm-list">
        {value.map((item, i) => (
          <div className="adm-list-item" key={i}>
            <div className="adm-list-item-head">
              <strong>{spec.itemTitle ? spec.itemTitle(item, i) : `${spec.label} ${i + 1}`}</strong>
              <div className="adm-list-tools">
                <button type="button" className="adm-icon-btn" aria-label="Move up" disabled={i === 0} onClick={() => move(i, -1)}>↑</button>
                <button type="button" className="adm-icon-btn" aria-label="Move down" disabled={i === value.length - 1} onClick={() => move(i, 1)}>↓</button>
                <button
                  type="button"
                  className="adm-icon-btn danger"
                  aria-label="Remove"
                  onClick={() => { if (!spec.confirmRemove || window.confirm(spec.confirmRemove)) onChange(value.filter((_, idx) => idx !== i)); }}
                >
                  &times;
                </button>
              </div>
            </div>
            <Fields fields={spec.fields} value={item} onChange={(v) => onChange(value.map((x, idx) => (idx === i ? v : x)))} />
          </div>
        ))}
      </div>
      <button type="button" className="adm-btn small" onClick={() => onChange([...value, spec.newItem()])}>+ {spec.addLabel || 'Add'}</button>
    </div>
  );
}

export function Fields({ fields, value, onChange }) {
  return (
    <div className="adm-fields">
      {fields.map((spec) => {
        const v = value?.[spec.key];
        const set = (nv) => onChange(setIn(value || {}, spec.key, nv));
        if (spec.type === 'group') {
          return (
            <fieldset className="adm-group" key={spec.key} style={spec.span ? { gridColumn: '1 / -1' } : undefined}>
              <legend>{spec.label}</legend>
              {spec.hint && <div className="adm-hint">{spec.hint}</div>}
              <Fields fields={spec.fields} value={v} onChange={set} />
            </fieldset>
          );
        }
        if (spec.type === 'strings') return <div key={spec.key} className="adm-field full"><Strings spec={spec} value={v} onChange={set} /></div>;
        if (spec.type === 'list') return <div key={spec.key} className="adm-field full"><List spec={spec} value={v} onChange={set} /></div>;
        const wide = spec.type === 'textarea' || spec.wide;
        return (
          <div key={spec.key} className={`adm-field${wide ? ' full' : ''}`}>
            {spec.type !== 'boolean' && <Label spec={spec} />}
            {spec.type === 'boolean' && spec.label && <label className="adm-label">{spec.label}</label>}
            <Scalar spec={spec} value={v} onChange={set} />
            {spec.type === 'boolean' && spec.hint && <div className="adm-hint">{spec.hint}</div>}
          </div>
        );
      })}
    </div>
  );
}
