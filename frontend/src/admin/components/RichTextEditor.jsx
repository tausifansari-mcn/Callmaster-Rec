import { useEffect, useRef, useState } from 'react';
import { adminApi } from '../../api/admin.js';

/**
 * The body editor for a blog post. Writes HTML, which the public page renders.
 *
 * Deliberately built on contenteditable rather than pulling in an editor library: the formatting
 * this needs is small and fixed, and the stored value stays plain HTML that any future editor can
 * still read. `document.execCommand` is formally deprecated but is the only API every current
 * browser implements for this, and there is no replacement.
 *
 * "Visual" is the formatted view; "Code" shows and edits the underlying HTML directly.
 */
const BLOCKS = [
  { label: 'Paragraph', tag: 'p' },
  { label: 'Heading 2', tag: 'h2' },
  { label: 'Heading 3', tag: 'h3' },
  { label: 'Heading 4', tag: 'h4' },
];

export default function RichTextEditor({ value, onChange }) {
  const ref = useRef(null);
  const [mode, setMode] = useState('visual'); // 'visual' | 'code'
  const [full, setFull] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  // Only write into the DOM when the incoming value differs, or every keystroke would reset the caret.
  useEffect(() => {
    if (mode === 'visual' && ref.current && ref.current.innerHTML !== (value || '')) ref.current.innerHTML = value || '';
  }, [value, mode]);

  // Esc leaves fullscreen, and the page behind shouldn't scroll while it's open.
  useEffect(() => {
    if (!full) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') setFull(false); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [full]);

  const emit = () => onChange(ref.current?.innerHTML || '');
  const run = (command, arg) => {
    ref.current?.focus();
    document.execCommand(command, false, arg);
    emit();
  };
  const setBlock = (tag) => run('formatBlock', `<${tag}>`);

  const addLink = () => {
    const url = window.prompt('Link address (https://… or /page)');
    if (url) run('createLink', url);
  };

  const addImage = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const { url } = await adminApi.uploadContentImage(file);
      run('insertHTML', `<img src="${url}" alt="" loading="lazy">`);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const Btn = ({ children, title, onClick, active }) => (
    <button type="button" className={`adm-btn small${active ? ' primary' : ''}`} title={title} onClick={onClick} style={{ minWidth: 34 }}>{children}</button>
  );

  return (
    <div className={`rte${full ? ' rte-full' : ''}`}>
      <div className="rte-tabs" role="tablist">
        <button type="button" role="tab" aria-selected={mode === 'visual'} className={mode === 'visual' ? 'on' : ''} onClick={() => setMode('visual')}>Visual</button>
        <button type="button" role="tab" aria-selected={mode === 'code'} className={mode === 'code' ? 'on' : ''} onClick={() => setMode('code')}>Code</button>
      </div>

      {mode === 'visual' && (
        <div className="rte-bar">
          <select className="adm-input rte-block" onChange={(e) => setBlock(e.target.value)} value="">
            <option value="" disabled>Format</option>
            {BLOCKS.map((b) => <option key={b.tag} value={b.tag}>{b.label}</option>)}
          </select>
          <Btn title="Bold" onClick={() => run('bold')}><b>B</b></Btn>
          <Btn title="Italic" onClick={() => run('italic')}><i>I</i></Btn>
          <Btn title="Bulleted list" onClick={() => run('insertUnorderedList')}>• List</Btn>
          <Btn title="Numbered list" onClick={() => run('insertOrderedList')}>1. List</Btn>
          <Btn title="Quote" onClick={() => setBlock('blockquote')}>❝</Btn>
          <Btn title="Align left" onClick={() => run('justifyLeft')}>⇤</Btn>
          <Btn title="Align centre" onClick={() => run('justifyCenter')}>↔</Btn>
          <Btn title="Align right" onClick={() => run('justifyRight')}>⇥</Btn>
          <Btn title="Link" onClick={addLink}>🔗</Btn>
          <label className="adm-btn small" style={{ cursor: uploading ? 'default' : 'pointer' }} title="Add media">
            {uploading ? 'Uploading…' : '🖼 Add media'}
            <input type="file" accept="image/*" hidden disabled={uploading} onChange={addImage} />
          </label>
          <Btn title="Remove formatting" onClick={() => run('removeFormat')}>Clear</Btn>
          <span style={{ flex: 1 }} />
          <Btn title={full ? 'Exit fullscreen (Esc)' : 'Fullscreen'} onClick={() => setFull((f) => !f)}>{full ? '⤡' : '⤢'}</Btn>
        </div>
      )}
      {mode === 'code' && (
        <div className="rte-bar">
          <span className="adm-muted small">Editing the HTML directly. Switch back to Visual to see it formatted.</span>
          <span style={{ flex: 1 }} />
          <Btn title={full ? 'Exit fullscreen (Esc)' : 'Fullscreen'} onClick={() => setFull((f) => !f)}>{full ? '⤡' : '⤢'}</Btn>
        </div>
      )}

      {mode === 'visual' ? (
        <div
          ref={ref}
          className="rte-body"
          contentEditable
          suppressContentEditableWarning
          onInput={emit}
          onBlur={emit}
          // Paste as plain text so copying from Word or a website doesn't drag in its styling.
          onPaste={(e) => {
            e.preventDefault();
            document.execCommand('insertText', false, e.clipboardData.getData('text/plain'));
            emit();
          }}
        />
      ) : (
        <textarea
          className="rte-code"
          spellCheck={false}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
      {error && <div className="adm-error" style={{ display: 'block', marginTop: 8 }}>{error}</div>}
    </div>
  );
}
