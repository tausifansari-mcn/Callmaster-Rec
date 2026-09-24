import { useCallback, useEffect, useState } from 'react';
import { adminApi } from '../../api/admin.js';
import { useToast } from '../AdminContext.jsx';
import { ErrorNote, Loading, PageHeader } from './ui.jsx';

/**
 * Searchable, filterable, paginated table for a collection (orders, leads, contacts, demos)
 * with CSV export and a detail modal.
 */
export default function ResourcePage({ resource, title, subtitle, columns, filters = [], Detail, searchPlaceholder = 'Search…', exportable = true }) {
  const toast = useToast();
  const [q, setQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [filterValues, setFilterValues] = useState({});
  const [range, setRange] = useState({ from: '', to: '' });
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedQ(q); setPage(1); }, 300);
    return () => clearTimeout(t);
  }, [q]);

  const query = { q: debouncedQ, ...filterValues, ...range, page, limit: 20 };
  const queryKey = JSON.stringify(query);

  const load = useCallback(async () => {
    setError('');
    try {
      setData(await adminApi.list(resource, JSON.parse(queryKey)));
    } catch (err) {
      setError(err.message);
    }
  }, [resource, queryKey]);
  useEffect(() => { load(); }, [load]);

  const exportCsv = async () => {
    try {
      const { page: _p, limit: _l, ...rest } = query;
      await adminApi.exportCsv(resource, rest);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const setFilter = (param, value) => { setFilterValues((f) => ({ ...f, [param]: value })); setPage(1); };

  return (
    <>
      <PageHeader
        title={title}
        subtitle={subtitle}
        actions={exportable ? <button type="button" className="adm-btn" onClick={exportCsv}>Export CSV</button> : undefined}
      />
      <div className="adm-toolbar">
        <input className="adm-input search" type="search" placeholder={searchPlaceholder} value={q} onChange={(e) => setQ(e.target.value)} />
        {filters.map((f) => (
          <select key={f.param} className="adm-input" value={filterValues[f.param] || ''} onChange={(e) => setFilter(f.param, e.target.value)} aria-label={f.label}>
            <option value="">{f.label}: all</option>
            {f.options.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        ))}
        <label className="adm-date">From <input className="adm-input" type="date" value={range.from} onChange={(e) => { setRange((r) => ({ ...r, from: e.target.value })); setPage(1); }} /></label>
        <label className="adm-date">To <input className="adm-input" type="date" value={range.to} onChange={(e) => { setRange((r) => ({ ...r, to: e.target.value })); setPage(1); }} /></label>
      </div>

      <ErrorNote error={error} onRetry={load} />
      {!data && !error && <Loading />}
      {data && (
        <div className="adm-card flush">
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead><tr>{columns.map((c) => <th key={c.label}>{c.label}</th>)}</tr></thead>
              <tbody>
                {data.items.map((row) => (
                  <tr key={row.id} className="clickable" onClick={() => setSelected(row)}>
                    {columns.map((c) => <td key={c.label}>{c.render(row)}</td>)}
                  </tr>
                ))}
                {!data.items.length && <tr><td colSpan={columns.length} className="adm-empty-cell">Nothing here yet.</td></tr>}
              </tbody>
            </table>
          </div>
          <div className="adm-pager">
            <span>{data.total} total</span>
            <div>
              <button type="button" className="adm-btn small" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>← Prev</button>
              <span className="adm-pager-num">Page {data.page} of {data.pages}</span>
              <button type="button" className="adm-btn small" disabled={page >= data.pages} onClick={() => setPage((p) => p + 1)}>Next →</button>
            </div>
          </div>
        </div>
      )}

      {selected && (
        <Detail
          item={selected}
          onClose={() => setSelected(null)}
          onChanged={(updated) => { setSelected(updated); setData((d) => d && ({ ...d, items: d.items.map((i) => (i.id === updated.id ? updated : i)) })); }}
          onDeleted={() => { setSelected(null); load(); }}
        />
      )}
    </>
  );
}
