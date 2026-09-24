import { useCallback, useEffect, useMemo, useState } from 'react';
import { adminApi } from '../../api/admin.js';
import { useToast } from '../AdminContext.jsx';
import { ErrorNote, Loading, PageHeader } from './ui.jsx';
import { Fields } from './SchemaForm.jsx';

/**
 * Loads one settings document, lets the admin edit it with a schema-driven form, and saves it.
 * `sections` lets a screen show several tabs of the same document (e.g. Pricing → Cloud Telephony / Dialers / …).
 */
export default function SettingsEditor({ settingKey, title, subtitle, fields, sections, previewPath, onSaved }) {
  const toast = useToast();
  const [saved, setSaved] = useState(null);
  const [draft, setDraft] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState(sections?.[0]?.id);

  const load = useCallback(async () => {
    setError('');
    try {
      const all = await adminApi.settings();
      setSaved(all[settingKey]);
      setDraft(structuredClone(all[settingKey]));
    } catch (err) {
      setError(err.message);
    }
  }, [settingKey]);
  useEffect(() => { load(); }, [load]);

  const dirty = useMemo(() => JSON.stringify(saved) !== JSON.stringify(draft), [saved, draft]);

  useEffect(() => {
    if (!dirty) return undefined;
    const warn = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const save = async () => {
    setSaving(true);
    try {
      const next = await adminApi.saveSetting(settingKey, draft);
      setSaved(next);
      setDraft(structuredClone(next));
      toast.success('Saved — the live site now uses these values.');
      onSaved?.();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const reset = async () => {
    if (!window.confirm('Reset this section to the original defaults? Your edits will be lost.')) return;
    try {
      const next = await adminApi.resetSetting(settingKey);
      setSaved(next);
      setDraft(structuredClone(next));
      toast.success('Restored the defaults.');
      onSaved?.();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const activeFields = sections ? sections.find((s) => s.id === tab)?.fields : fields;

  return (
    <>
      <PageHeader
        title={title}
        subtitle={subtitle}
        actions={(
          <>
            {previewPath && <a className="adm-btn" href={previewPath} target="_blank" rel="noreferrer">View live page ↗</a>}
            <button type="button" className="adm-btn" onClick={reset} disabled={!draft}>Restore defaults</button>
            <button type="button" className="adm-btn primary" onClick={save} disabled={!dirty || saving}>{saving ? 'Saving…' : 'Save changes'}</button>
          </>
        )}
      />
      <ErrorNote error={error} onRetry={load} />
      {!draft && !error && <Loading />}
      {draft && (
        <>
          {sections && (
            <div className="adm-tabs" role="tablist">
              {sections.map((s) => (
                <button key={s.id} type="button" role="tab" aria-selected={tab === s.id} className={`adm-tab${tab === s.id ? ' active' : ''}`} onClick={() => setTab(s.id)}>{s.label}</button>
              ))}
            </div>
          )}
          <div className="adm-card">
            <Fields fields={activeFields} value={draft} onChange={setDraft} />
          </div>
          {dirty && <div className="adm-savebar">You have unsaved changes <button type="button" className="adm-btn primary" onClick={save} disabled={saving}>Save changes</button></div>}
        </>
      )}
    </>
  );
}
