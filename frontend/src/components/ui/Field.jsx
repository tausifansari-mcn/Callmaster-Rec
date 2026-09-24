/**
 * Labelled form field with the site's inline validation styling. Pass `error` to show the message
 * (the `.invalid` class turns the input border red and reveals `.err`).
 */
export default function Field({ label, error, hint, className = '', htmlFor, children, style }) {
  return (
    <div className={`field${error ? ' invalid' : ''}${className ? ` ${className}` : ''}`} style={style}>
      {label && <label htmlFor={htmlFor}>{label}</label>}
      {children}
      {hint && <div className="hint">{hint}</div>}
      <div className="err">{error}</div>
    </div>
  );
}

