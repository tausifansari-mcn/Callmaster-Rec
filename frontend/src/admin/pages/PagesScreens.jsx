import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { adminApi } from '../../api/admin.js';
import { Fields } from '../components/SchemaForm.jsx';
import { Badge, ErrorNote, Loading, PageHeader, fmtDate } from '../components/ui.jsx';
import { useToast } from '../AdminContext.jsx';

export function PagesList() {
  const [pages, setPages] = useState(null);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    setError('');
    try { setPages(await adminApi.pages()); } catch (err) { setError(err.message); }
  }, []);
  useEffect(() => { load(); }, [load]);

  return (
    <>
      <PageHeader
        title="Pages & legal"
        subtitle="Terms, privacy and refund policies live here, and you can add any new page (careers, security, case studies…). Pages appear at /your-url and can be linked from the footer."
        actions={<Link to="/admin/pages/new" className="adm-btn primary">+ New page</Link>}
      />
      <ErrorNote error={error} onRetry={load} />
      {!pages && !error && <Loading />}
      {pages && (
        <div className="adm-card flush">
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead><tr><th>Title</th><th>URL</th><th>Type</th><th>Status</th><th>Footer</th><th>Updated</th></tr></thead>
              <tbody>
                {pages.map((p) => (
                  <tr key={p.id}>
                    <td><Link to={`/admin/pages/${p.id}`}><strong>{p.title}</strong></Link></td>
                    <td><a href={`/${p.slug}`} target="_blank" rel="noreferrer">/{p.slug}</a></td>
                    <td><Badge value={p.kind} /></td>
                    <td><Badge value={p.published ? 'published' : 'draft'} /></td>
                    <td>{p.showInFooter ? p.footerColumn : '—'}</td>
                    <td>{fmtDate(p.updatedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}

const EMPTY = { slug: '', title: '', sections: [{ heading: '', body: '' }], published: true, showInFooter: true, footerColumn: 'company', order: 100 };

export function PageEditor() {
  const { id } = useParams();
  const isNew = id === 'new';
  const navigate = useNavigate();
  const toast = useToast();
  const [page, setPage] = useState(isNew ? EMPTY : null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isNew) { setPage(EMPTY); return undefined; }
    let alive = true;
    adminApi.page(id).then((p) => alive && setPage(p)).catch((err) => alive && setError(err.message));
    return () => { alive = false; };
  }, [id, isNew]);

  if (error) return <><PageHeader title="Page" /><ErrorNote error={error} /></>;
  if (!page) return <Loading />;
  const isLegal = page.kind === 'legal';

  const payload = () => ({
    slug: page.slug, title: page.title, sections: page.sections, published: page.published,
    showInFooter: page.showInFooter, footerColumn: page.footerColumn, order: page.order,
  });

  const save = async () => {
    setSaving(true);
    try {
      if (isNew) {
        const created = await adminApi.createPage(payload());
        toast.success('Page created');
        navigate(`/admin/pages/${created.id}`, { replace: true });
      } else {
        setPage(await adminApi.updatePage(id, payload()));
        toast.success('Saved');
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!window.confirm(`Delete "${page.title}" permanently?`)) return;
    try { await adminApi.deletePage(id); toast.success('Deleted'); navigate('/admin/pages'); } catch (err) { toast.error(err.message); }
  };

  return (
    <>
      <PageHeader
        title={isNew ? 'New page' : page.title}
        subtitle={isLegal ? 'Built-in legal page — the URL is fixed, everything else is editable.' : undefined}
        actions={(
          <>
            <Link to="/admin/pages" className="adm-btn">← All pages</Link>
            {!isNew && page.published && <a className="adm-btn" href={`/${page.slug}`} target="_blank" rel="noreferrer">View live ↗</a>}
            {!isNew && !isLegal && <button type="button" className="adm-btn danger" onClick={remove}>Delete</button>}
            <button type="button" className="adm-btn primary" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
          </>
        )}
      />
      <div className="adm-card">
        <Fields
          value={page}
          onChange={setPage}
          fields={[
            { type: 'text', key: 'title', label: 'Page title', wide: true },
            ...(isLegal ? [] : [{ type: 'text', key: 'slug', label: 'URL', placeholder: 'careers', hint: 'Lowercase letters, numbers and dashes. The page will live at /your-url.' }]),
            { type: 'boolean', key: 'published', label: 'Visibility', switchLabel: 'Published (visible to visitors)' },
            { type: 'boolean', key: 'showInFooter', label: 'Footer', switchLabel: 'Show a link in the footer' },
            { type: 'select', key: 'footerColumn', label: 'Footer column', options: ['product', 'company', 'legal'] },
            { type: 'number', key: 'order', label: 'Sort order', step: 1, hint: 'Lower numbers appear first in the footer.' },
            {
              type: 'list', key: 'sections', label: 'Content', addLabel: 'Add section', confirmRemove: 'Remove this section?',
              hint: 'Each section has a heading and text. In the text: a blank line starts a new paragraph, **bold**, and [link text](/contact) for links. [domain] and [operating entity name] are replaced with your Site settings values.',
              itemTitle: (s, i) => s.heading || `Section ${i + 1}`,
              newItem: () => ({ heading: '', body: '' }),
              fields: [{ type: 'text', key: 'heading', label: 'Heading', wide: true }, { type: 'textarea', key: 'body', label: 'Text', rows: 6 }],
            },
          ]}
        />
      </div>
    </>
  );
}
