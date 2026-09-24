import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { adminApi } from '../../api/admin.js';
import SettingsEditor from '../components/SettingsEditor.jsx';
import { useAuth } from '../AdminContext.jsx';

const SERVICES = [
  { id: 'deepgram', name: 'Deepgram', role: 'Turns the uploaded call into a speaker-labelled transcript' },
  { id: 'anthropic', name: 'Anthropic (Claude)', role: 'Audits the transcript for the selected line of business' },
];

/** Which key is active (last 4 characters only), where it comes from, and a free "test connection" per service. */
function KeyStatusCard({ version }) {
  const [status, setStatus] = useState(null);
  const [results, setResults] = useState({});
  const [testing, setTesting] = useState('');

  useEffect(() => {
    let alive = true;
    setResults({});
    adminApi.integrationStatus().then((s) => alive && setStatus(s)).catch(() => {});
    return () => { alive = false; };
  }, [version]);

  const test = async (id) => {
    setTesting(id);
    setResults((r) => ({ ...r, [id]: undefined }));
    try {
      const res = await adminApi.testIntegration(id);
      setResults((r) => ({ ...r, [id]: res }));
    } catch (err) {
      setResults((r) => ({ ...r, [id]: { ok: false, message: err.message } }));
    } finally {
      setTesting('');
    }
  };

  return (
    <div className="adm-card">
      <h3 className="adm-card-title">Keys in use right now</h3>
      <p className="adm-muted small" style={{ marginTop: -6 }}>
        “Test connection” checks the <strong>saved</strong> key with the provider — it is free and does not run an audit. Save your changes first, then test.
        {status && (status.live
          ? ' Audits are running live.'
          : ' Audits are NOT live: both keys are needed, otherwise visitors get a clearly-labelled sample scorecard.')}
      </p>
      <div className="adm-table-wrap">
        <table className="adm-table">
          <thead><tr><th>Service</th><th>Key</th><th>Model</th><th /></tr></thead>
          <tbody>
            {SERVICES.map((s) => {
              const st = status?.[s.id];
              const r = results[s.id];
              return (
                <tr key={s.id}>
                  <td><strong>{s.name}</strong><div className="adm-muted small">{s.role}</div></td>
                  <td>
                    {!st ? '…' : st.configured
                      ? <>ending <code>…{st.last4}</code><div className="adm-muted small">from the {st.source}</div></>
                      : <span className="neg">Not set</span>}
                  </td>
                  <td>{st?.model || '—'}</td>
                  <td className="adm-row-actions">
                    <button type="button" className="adm-btn small" onClick={() => test(s.id)} disabled={!st?.configured || testing === s.id}>
                      {testing === s.id ? 'Testing…' : 'Test connection'}
                    </button>
                    {r && <div className={r.ok ? 'adm-toast' : 'adm-error'} style={{ display: 'block', marginTop: 8, textAlign: 'left', whiteSpace: 'normal' }}>{r.message}</div>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function IntegrationsScreen() {
  const { admin } = useAuth();
  const [version, setVersion] = useState(0);
  if (admin.role !== 'superadmin') return <Navigate to="/admin" replace />;

  return (
    <>
      <SettingsEditor
        settingKey="integrations"
        title="API keys — Deepgram & Claude"
        subtitle="The keys used to transcribe and audit uploaded calls. Paste a new key and save: it applies to the next audit, with no restart or code change. Keys are stored encrypted and only their last 4 characters are ever shown."
        onSaved={() => setVersion((v) => v + 1)}
        fields={[
          {
            type: 'group', key: 'deepgram', label: 'Deepgram — speech to text',
            hint: 'Get a key at console.deepgram.com → API Keys. Leave the key box untouched to keep the current key; clear it to fall back to the key in backend/.env.',
            fields: [
              { type: 'password', key: 'apiKey', label: 'Deepgram API key', placeholder: 'Paste the new key here', wide: true },
              { type: 'text', key: 'model', label: 'Model', placeholder: 'nova-3', hint: 'nova-3 handles English, Hindi and mixed calls.' },
              { type: 'text', key: 'language', label: 'Language mode', placeholder: 'multi', hint: '“multi” = English + Hindi in one pass, or a code such as en or hi.' },
            ],
          },
          {
            type: 'group', key: 'anthropic', label: 'Anthropic — Claude call audit',
            hint: 'Get a key at console.anthropic.com → API Keys. Leave the key box untouched to keep the current key; clear it to fall back to the key in backend/.env.',
            fields: [
              { type: 'password', key: 'apiKey', label: 'Anthropic API key', placeholder: 'sk-ant-…', wide: true },
              { type: 'text', key: 'model', label: 'Model', placeholder: 'claude-sonnet-5', hint: 'Test connection tells you whether the key can use this model.' },
            ],
          },
        ]}
      />
      <KeyStatusCard version={version} />
    </>
  );
}
