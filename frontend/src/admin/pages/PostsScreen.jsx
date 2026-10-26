import { useCallback, useEffect, useState } from 'react';
import { adminApi } from '../../api/admin.js';
import { useToast } from '../AdminContext.jsx';
import { ErrorNote, Loading, PageHeader } from '../components/ui.jsx';
import RichTextEditor from '../components/RichTextEditor.jsx';

const EMPTY = {
  slug: '', title: '', excerpt: '', body: '', category: '', tags: [],
  coverImage: '', readTime: '', author: 'The Nimantran team',
  status: 'draft', seoTitle: '', seoDescription: '',
};

/** "Why answer rates fall" → "why-answer-rates-fall" */
const slugify = (s) => String(s).toLowerCase().trim()
  .replace(/['’]/g, '')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '')
  .slice(0, 160);

const wordCount = (html) => {
  const text = String(html).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  return text ? text.split(' ').length : 0;
};

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : '—');

/** Cover picture: upload a file or paste an address. */
function CoverImage({ value, onChange }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const pick = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBusy(true); setError('');
    try { onChange((await adminApi.uploadContentImage(file)).url); } catch (err) { setError(err.message); } finally { setBusy(false); }
  };
  return (
    <>
      <div className="adm-string-row">
        <input className="adm-input" type="text" placeholder="Upload, or paste an address" value={value} onChange={(e) => onChange(e.target.value)} />
        <label className="adm-btn" style={{ whiteSpace: 'nowrap', cursor: busy ? 'default' : 'pointer' }}>
          {busy ? 'Uploading…' : 'Upload'}
          <input type="file" accept="image/*" hidden disabled={busy} onChange={pick} />
        </label>
        {value && <button type="button" className="adm-icon-btn danger" aria-label="Remove" onClick={() => onChange('')}>&times;</button>}
      </div>
      {error && <div className="adm-error" style={{ display: 'block', marginTop: 8 }}>{error}</div>}
      {value && <img src={value} alt="" style={{ marginTop: 10, width: '100%', maxWidth: 320, borderRadius: 8, display: 'block' }} />}
    </>
  );
}

function Editor({ post, onDone }) {
  const toast = useToast();
  const [v, setV] = useState(post ? { ...EMPTY, ...post } : EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  // A slug is only auto-filled while the post has never been saved; changing it later breaks links.
  const [autoSlug, setAutoSlug] = useState(!post);

  const set = (k) => (val) => setV((s) => ({ ...s, [k]: val }));
  const setField = (k) => (e) => set(k)(e.target.value);

  const onTitle = (e) => {
    const title = e.target.value;
    setV((s) => ({ ...s, title, ...(autoSlug ? { slug: slugify(title) } : {}) }));
  };

  const save = async (status) => {
    setError('');
    if (!v.title.trim()) { setError('Give the post a title first.'); return; }
    const body = { ...v, status, slug: v.slug || slugify(v.title), tags: v.tags };
    setSaving(true);
    try {
      const saved = post ? await adminApi.updatePost(post.id, body) : await adminApi.createPost(body);
      toast.success(status === 'published' ? 'Published — it is live on the Insights page.' : 'Draft saved.');
      onDone(saved);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const words = wordCount(v.body);
  const seoTitle = v.seoTitle || v.title || 'Untitled';
  const seoDesc = v.seoDescription || v.excerpt;

  return (
    <>
      <PageHeader
        title={post ? 'Edit post' : 'New post'}
        subtitle="Written here, shown on the Insights page. Drafts stay private until you publish."
        actions={(
          <>
            <button type="button" className="adm-btn" onClick={() => onDone(null)}>Back</button>
            <button type="button" className="adm-btn" disabled={saving} onClick={() => save('draft')}>Save draft</button>
            <button type="button" className="adm-btn primary" disabled={saving} onClick={() => save('published')}>
              {saving ? 'Saving…' : (v.status === 'published' ? 'Update' : 'Publish')}
            </button>
          </>
        )}
      />
      {error && <div className="adm-error" style={{ display: 'block', marginBottom: 14 }}>{error}</div>}

      <div className="post-edit">
        <div>
          <div className="adm-card">
            <input className="adm-input post-title" type="text" placeholder="Add title" value={v.title} onChange={onTitle} />
            <div className="adm-muted small" style={{ margin: '8px 0 14px' }}>
              Link: <code>/insights/{v.slug || 'post-address'}</code>
              {' '}
              <button type="button" className="adm-btn small" onClick={() => { setAutoSlug(false); const s = window.prompt('Post address (letters, numbers and dashes)', v.slug); if (s) set('slug')(slugify(s)); }}>Edit</button>
            </div>
            <RichTextEditor value={v.body} onChange={set('body')} />
            <div className="adm-muted small" style={{ marginTop: 8 }}>{words} words</div>
          </div>

          <div className="adm-card">
            <h3 className="adm-card-title">Search appearance</h3>
            <p className="adm-muted small" style={{ marginTop: -6 }}>How this looks in Google results. Leave blank to use the title and teaser.</p>
            <div className="seo-preview">
              <div className="seo-url">nimantran.ai › insights › {v.slug || 'post-address'}</div>
              <div className="seo-title">{seoTitle}</div>
              <div className="seo-desc">{seoDesc || 'Add a teaser or meta description so Google shows a useful summary.'}</div>
            </div>
            <div className="adm-field full" style={{ marginTop: 14 }}>
              <label className="adm-label">SEO title</label>
              <input className="adm-input" type="text" value={v.seoTitle} onChange={setField('seoTitle')} placeholder={v.title || 'Defaults to the post title'} />
              <div className="adm-hint">{(v.seoTitle || '').length}/60 characters is the usual limit before Google truncates it.</div>
            </div>
            <div className="adm-field full">
              <label className="adm-label">Meta description</label>
              <textarea className="adm-input" rows={3} value={v.seoDescription} onChange={setField('seoDescription')} placeholder="Defaults to the teaser below" />
              <div className="adm-hint">{(v.seoDescription || '').length}/160 characters.</div>
            </div>
          </div>
        </div>

        <div>
          <div className="adm-card">
            <h3 className="adm-card-title">Publish</h3>
            <div className="adm-muted small">Status: <b>{v.status === 'published' ? 'Published' : 'Draft'}</b></div>
            {post?.publishedAt && <div className="adm-muted small">First published {fmtDate(post.publishedAt)}</div>}
            <div className="adm-field full" style={{ marginTop: 12 }}>
              <label className="adm-label">Author</label>
              <input className="adm-input" type="text" value={v.author} onChange={setField('author')} />
            </div>
            <div className="adm-field full">
              <label className="adm-label">Read time</label>
              <input className="adm-input" type="text" value={v.readTime} onChange={setField('readTime')} placeholder="5 min read" />
            </div>
          </div>

          <div className="adm-card">
            <h3 className="adm-card-title">Featured image</h3>
            <CoverImage value={v.coverImage} onChange={set('coverImage')} />
          </div>

          <div className="adm-card">
            <h3 className="adm-card-title">Category &amp; tags</h3>
            <div className="adm-field full">
              <label className="adm-label">Category</label>
              <input className="adm-input" type="text" value={v.category} onChange={setField('category')} placeholder="Quality, Voice Bots, Compliance…" />
            </div>
            <div className="adm-field full">
              <label className="adm-label">Tags</label>
              <input
                className="adm-input" type="text"
                value={Array.isArray(v.tags) ? v.tags.join(', ') : ''}
                onChange={(e) => set('tags')(e.target.value.split(',').map((t) => t.trim()).filter(Boolean))}
                placeholder="Separate with commas"
              />
            </div>
          </div>

          <div className="adm-card">
            <h3 className="adm-card-title">Teaser</h3>
            <p className="adm-muted small" style={{ marginTop: -6 }}>Shown on the Insights listing under the title.</p>
            <textarea className="adm-input" rows={4} value={v.excerpt} onChange={setField('excerpt')} />
          </div>
        </div>
      </div>
    </>
  );
}

export default function PostsScreen() {
  const toast = useToast();
  const [posts, setPosts] = useState(null);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(undefined); // undefined = list, null = new, object = edit

  const load = useCallback(async () => {
    setError('');
    try { setPosts(await adminApi.posts()); } catch (err) { setError(err.message); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const remove = async (p) => {
    if (!window.confirm(`Delete "${p.title}"? This cannot be undone.`)) return;
    try { await adminApi.deletePost(p.id); toast.success('Post deleted.'); load(); } catch (err) { toast.error(err.message); }
  };

  if (editing !== undefined) {
    return <Editor post={editing} onDone={() => { setEditing(undefined); load(); }} />;
  }

  return (
    <>
      <PageHeader
        title="Blog posts"
        subtitle="Articles on the Insights page. Write, save as a draft, and publish when it is ready."
        actions={<button type="button" className="adm-btn primary" onClick={() => setEditing(null)}>Add new post</button>}
      />
      <ErrorNote error={error} onRetry={load} />
      {!posts && !error && <Loading />}
      {posts && posts.length === 0 && (
        <div className="adm-card"><p className="adm-muted">No posts yet. Click <b>Add new post</b> to write the first one.</p></div>
      )}
      {posts && posts.length > 0 && (
        <div className="adm-card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="adm-table">
            <thead><tr><th>Title</th><th>Category</th><th>Status</th><th>Published</th><th /></tr></thead>
            <tbody>
              {posts.map((p) => (
                <tr key={p.id}>
                  <td>
                    <b>{p.title}</b>
                    <div className="adm-muted small">/insights/{p.slug}</div>
                  </td>
                  <td>{p.category || '—'}</td>
                  <td>
                    <span className={`adm-pill ${p.status === 'published' ? 'ok' : ''}`}>
                      {p.status === 'published' ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td>{fmtDate(p.publishedAt)}</td>
                  <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                    {p.status === 'published' && (
                      <a className="adm-btn small" href={`/insights/${p.slug}`} target="_blank" rel="noreferrer">View</a>
                    )}
                    <button type="button" className="adm-btn small" onClick={() => setEditing(p)}>Edit</button>
                    <button type="button" className="adm-icon-btn danger" aria-label="Delete" onClick={() => remove(p)}>&times;</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
