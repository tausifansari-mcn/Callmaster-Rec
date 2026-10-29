import { useCallback, useEffect, useMemo, useState } from 'react';
import { adminApi } from '../../api/admin.js';
import { useToast } from '../AdminContext.jsx';
import { ErrorNote, Loading, PageHeader } from '../components/ui.jsx';
import RichTextEditor from '../components/RichTextEditor.jsx';
import { analyseReadability, analyseSeo, overall, wordCount } from '../utils/postAnalysis.js';

const EMPTY = {
  slug: '', title: '', excerpt: '', body: '', categories: [], tags: [],
  coverImage: '', readTime: '', author: 'The Nimantran team',
  status: 'draft', visibility: 'public', focusKeyphrase: '',
  seoTitle: '', seoDescription: '', publishedAt: null,
};

/** "Why answer rates fall" → "why-answer-rates-fall" */
const slugify = (s) => String(s).toLowerCase().trim()
  .replace(/['’]/g, '')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '')
  .slice(0, 160);

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : '—');

/** A <input type="datetime-local"> wants local "YYYY-MM-DDTHH:mm"; the API wants an ISO instant. */
const toLocalInput = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

/** Teaser read time from the word count, at a typical 200 words a minute. */
const estimateRead = (html) => `${Math.max(1, Math.round(wordCount(html) / 200))} min read`;

const DOT = { good: '#16A34A', ok: '#D9A05B', bad: '#E5484D' };
const ICON = { good: '●', ok: '●', bad: '●' };

/** One expandable analysis panel with a red / amber / green dot, like a WordPress SEO plugin. */
function AnalysisPanel({ title, checks }) {
  const [open, setOpen] = useState(false);
  const level = overall(checks);
  const counts = { bad: 0, ok: 0, good: 0 };
  checks.forEach((c) => { counts[c.level]++; });
  return (
    <div className="ana">
      <button type="button" className="ana-head" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <span style={{ color: DOT[level] }} aria-hidden="true">{ICON[level]}</span>
        <span className="ana-title">{title}</span>
        <span className="adm-muted small">{counts.bad} to fix · {counts.ok} to improve · {counts.good} good</span>
        <span className="ana-caret">{open ? '▴' : '▾'}</span>
      </button>
      {open && (
        <ul className="ana-list">
          {checks.map((c, i) => (
            <li key={i}><span style={{ color: DOT[c.level] }} aria-hidden="true">{ICON[c.level]}</span><span>{c.text}</span></li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Featured image: upload a file or paste an address. */
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
      {value && <img src={value} alt="" style={{ marginBottom: 10, width: '100%', borderRadius: 8, display: 'block' }} />}
      <div className="adm-string-row">
        <input className="adm-input" type="text" placeholder="Upload, or paste an address" value={value} onChange={(e) => onChange(e.target.value)} />
        <label className="adm-btn" style={{ whiteSpace: 'nowrap', cursor: busy ? 'default' : 'pointer' }}>
          {busy ? 'Uploading…' : (value ? 'Replace' : 'Set image')}
          <input type="file" accept="image/*" hidden disabled={busy} onChange={pick} />
        </label>
        {value && <button type="button" className="adm-icon-btn danger" aria-label="Remove image" onClick={() => onChange('')}>&times;</button>}
      </div>
      {error && <div className="adm-error" style={{ display: 'block', marginTop: 8 }}>{error}</div>}
    </>
  );
}

/** Categories as a checkbox list with "+ Add category", as in WordPress. */
function Categories({ selected, known, onChange }) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState('');
  // Names already chosen but not yet saved anywhere still need to appear in the list.
  const all = useMemo(() => [...new Set([...known, ...selected])].sort((a, b) => a.localeCompare(b)), [known, selected]);
  const toggle = (name) => onChange(selected.includes(name) ? selected.filter((c) => c !== name) : [...selected, name]);
  const add = () => {
    const name = draft.trim();
    if (!name) return;
    if (!selected.includes(name)) onChange([...selected, name]);
    setDraft(''); setAdding(false);
  };
  return (
    <>
      <div className="cat-box">
        {all.length === 0 && <div className="adm-muted small">No categories yet.</div>}
        {all.map((c) => (
          <label className="cat-row" key={c}>
            <input type="checkbox" checked={selected.includes(c)} onChange={() => toggle(c)} /> {c}
          </label>
        ))}
      </div>
      {adding ? (
        <div className="adm-string-row" style={{ marginTop: 8 }}>
          <input
            className="adm-input" type="text" autoFocus placeholder="New category name" value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } if (e.key === 'Escape') setAdding(false); }}
          />
          <button type="button" className="adm-btn" onClick={add}>Add</button>
        </div>
      ) : (
        <button type="button" className="adm-link" onClick={() => setAdding(true)}>+ Add category</button>
      )}
    </>
  );
}

/** Tags as chips with an Add button. */
function Tags({ value, onChange }) {
  const [draft, setDraft] = useState('');
  const add = () => {
    const incoming = draft.split(',').map((t) => t.trim()).filter(Boolean);
    if (!incoming.length) return;
    onChange([...new Set([...value, ...incoming])]);
    setDraft('');
  };
  return (
    <>
      <div className="adm-string-row">
        <input
          className="adm-input" type="text" value={draft} placeholder="Add a tag"
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add(); } }}
        />
        <button type="button" className="adm-btn" onClick={add}>Add</button>
      </div>
      <div className="adm-muted small" style={{ margin: '6px 0' }}>Separate tags with commas</div>
      <div className="tag-chips">
        {value.map((t) => (
          <span className="tag-chip" key={t}>
            {t}
            <button type="button" aria-label={`Remove ${t}`} onClick={() => onChange(value.filter((x) => x !== t))}>&times;</button>
          </span>
        ))}
      </div>
    </>
  );
}

/** Full-page preview of the post as a visitor would see it, without saving. */
function Preview({ post, onClose }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="prev-overlay" role="dialog" aria-label="Post preview">
      <div className="prev-bar">
        <b>Preview</b>
        <span className="adm-muted small">This is how the post will look on the Insights page. Nothing is saved.</span>
        <span style={{ flex: 1 }} />
        <button type="button" className="adm-btn" onClick={onClose}>Close preview</button>
      </div>
      <div className="prev-scroll">
        <article className="post prev-post">
          {post.categories[0] && <div className="kicker">{post.categories[0]}</div>}
          <h1>{post.title || 'Untitled'}</h1>
          <span className="insight-meta">{post.readTime || estimateRead(post.body)} &middot; By {post.author || 'the Nimantran team'}</span>
          {post.coverImage && <img className="post-cover" src={post.coverImage} alt="" />}
          {/* The body is HTML the author wrote; the server strips scripts and handlers when it is saved. */}
          <div dangerouslySetInnerHTML={{ __html: post.body }} />
        </article>
      </div>
    </div>
  );
}

function Editor({ post, onDone }) {
  const toast = useToast();
  const [v, setV] = useState(post ? { ...EMPTY, ...post } : EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [known, setKnown] = useState([]);
  const [preview, setPreview] = useState(false);
  // A slug is only auto-filled while the post has never been saved; changing it later breaks links.
  const [autoSlug, setAutoSlug] = useState(!post);
  // 'now' = stamp the moment it goes live; 'later' = the date picker is in charge.
  const [when, setWhen] = useState(post?.publishedAt && post.status === 'published' ? 'later' : 'now');
  const [dirty, setDirty] = useState(false);

  useEffect(() => { adminApi.postCategories().then(setKnown).catch(() => {}); }, []);

  // Warn before the tab closes with unsaved work, as the settings screens do.
  useEffect(() => {
    if (!dirty) return undefined;
    const warn = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const set = (k) => (val) => { setDirty(true); setV((s) => ({ ...s, [k]: val })); };
  const setField = (k) => (e) => set(k)(e.target.value);

  const onTitle = (e) => {
    const title = e.target.value;
    setDirty(true);
    setV((s) => ({ ...s, title, ...(autoSlug ? { slug: slugify(title) } : {}) }));
  };

  const seo = useMemo(() => analyseSeo(v), [v]);
  const readability = useMemo(() => analyseReadability(v), [v]);
  const words = wordCount(v.body);

  // What the author has chosen to do (a future date picked), regardless of whether the post is saved yet —
  // a brand-new post is still a draft, but the button should already say "Schedule".
  const scheduling = when === 'later' && Boolean(v.publishedAt) && new Date(v.publishedAt) > new Date();
  // What is true of the saved post right now.
  const scheduled = v.status === 'published' && scheduling;

  const save = async (status) => {
    setError('');
    if (!v.title.trim()) { setError('Give the post a title first.'); return; }
    const body = {
      ...v,
      status,
      slug: v.slug || slugify(v.title),
      readTime: v.readTime || estimateRead(v.body),
      publishedAt: status === 'published' && when === 'later' && v.publishedAt ? new Date(v.publishedAt).toISOString() : null,
    };
    setSaving(true);
    try {
      const saved = post ? await adminApi.updatePost(post.id, body) : await adminApi.createPost(body);
      const live = status === 'published' && body.visibility === 'public' && !(body.publishedAt && new Date(body.publishedAt) > new Date());
      toast.success(
        status !== 'published' ? 'Draft saved.'
          : body.visibility === 'private' ? 'Saved as private — only admins can see it.'
            : live ? 'Published — it is live on the Insights page.' : `Scheduled for ${fmtDate(body.publishedAt)}.`
      );
      setDirty(false);
      onDone(saved);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const suggestSeoTitle = () => set('seoTitle')(v.title.slice(0, 60));
  const suggestDescription = () => {
    const text = (v.excerpt || v.body.replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim();
    if (text) set('seoDescription')(text.length > 155 ? `${text.slice(0, 155).replace(/\s+\S*$/, '')}…` : text);
  };

  const seoTitle = v.seoTitle || v.title || 'Untitled';
  const seoDesc = v.seoDescription || v.excerpt;
  const publishLabel = scheduling ? 'Schedule' : (v.status === 'published' ? 'Update' : 'Publish');

  return (
    <>
      {preview && <Preview post={v} onClose={() => setPreview(false)} />}
      <PageHeader
        title={post ? 'Edit post' : 'Add new post'}
        subtitle="Written here, shown on the Insights page. Drafts stay private until you publish."
        actions={<button type="button" className="adm-btn" onClick={() => { if (!dirty || window.confirm('Leave without saving your changes?')) onDone(null); }}>Back to posts</button>}
      />
      {error && <div className="adm-error" style={{ display: 'block', marginBottom: 14 }}>{error}</div>}

      <div className="post-edit">
        <div>
          <div className="adm-card">
            <input className="adm-input post-title" type="text" placeholder="Add title" value={v.title} onChange={onTitle} />
            <div className="adm-muted small" style={{ margin: '8px 0 14px' }}>
              <b>Permalink:</b> <code>/insights/{v.slug || 'post-address'}</code>{' '}
              <button type="button" className="adm-btn small" onClick={() => { const s = window.prompt('Post address (letters, numbers and dashes)', v.slug); if (s) { setAutoSlug(false); set('slug')(slugify(s)); } }}>Edit</button>
            </div>
            <RichTextEditor value={v.body} onChange={set('body')} />
            <div className="adm-muted small" style={{ marginTop: 8 }}>Word count: {words}</div>
          </div>

          <div className="adm-card yoast">
            <h3 className="adm-card-title">SEO</h3>

            <div className="adm-field full">
              <label className="adm-label">Focus keyphrase</label>
              <input className="adm-input" type="text" value={v.focusKeyphrase} onChange={setField('focusKeyphrase')} placeholder="The main phrase you want this post found for" />
              <div className="adm-hint">Use the main word or phrase you want your content found for in search.</div>
            </div>

            <h4 className="adm-sub">Search appearance</h4>
            <div className="seo-preview">
              <div className="seo-url">nimantran.ai › insights › {v.slug || 'post-address'}</div>
              <div className="seo-title">{seoTitle}</div>
              <div className="seo-desc">{seoDesc || 'Add a teaser or meta description so Google shows a useful summary.'}</div>
            </div>

            <div className="adm-field full" style={{ marginTop: 14 }}>
              <div className="adm-label-row">
                <label className="adm-label">SEO title</label>
                <button type="button" className="adm-btn small" onClick={suggestSeoTitle}>Use post title</button>
              </div>
              <input className="adm-input" type="text" value={v.seoTitle} onChange={setField('seoTitle')} placeholder={v.title || 'Defaults to the post title'} />
              <div className="adm-hint">{(v.seoTitle || v.title || '').length}/60 characters is the usual limit before Google truncates it.</div>
            </div>
            <div className="adm-field full">
              <label className="adm-label">Slug</label>
              <input className="adm-input" type="text" value={v.slug} onChange={(e) => { setAutoSlug(false); set('slug')(slugify(e.target.value)); }} />
            </div>
            <div className="adm-field full">
              <div className="adm-label-row">
                <label className="adm-label">Meta description</label>
                <button type="button" className="adm-btn small" onClick={suggestDescription}>Fill from content</button>
              </div>
              <textarea className="adm-input" rows={3} value={v.seoDescription} onChange={setField('seoDescription')} placeholder="Defaults to the teaser below" />
              <div className="adm-hint">{(v.seoDescription || v.excerpt || '').length}/160 characters.</div>
            </div>

            <AnalysisPanel title="SEO analysis" checks={seo} />
            <AnalysisPanel title="Readability analysis" checks={readability} />
          </div>
        </div>

        <div>
          <div className="adm-card">
            <h3 className="adm-card-title">Publish</h3>
            <div className="pub-actions">
              <button type="button" className="adm-btn" disabled={saving} onClick={() => save('draft')}>Save draft</button>
              <button type="button" className="adm-btn" onClick={() => setPreview(true)}>Preview</button>
            </div>

            <div className="pub-row"><span>Status:</span> <b>{v.status === 'published' ? (scheduled ? 'Scheduled' : 'Published') : 'Draft'}</b></div>

            <div className="pub-row">
              <span>Visibility:</span>
              <select className="adm-input pub-select" value={v.visibility} onChange={setField('visibility')}>
                <option value="public">Public</option>
                <option value="private">Private (admins only)</option>
              </select>
            </div>

            <div className="pub-row" style={{ alignItems: 'flex-start' }}>
              <span>Publish:</span>
              <div style={{ flex: 1 }}>
                <select className="adm-input pub-select" value={when} onChange={(e) => { setDirty(true); setWhen(e.target.value); if (e.target.value === 'later' && !v.publishedAt) set('publishedAt')(new Date().toISOString()); }}>
                  <option value="now">Immediately</option>
                  <option value="later">On a set date</option>
                </select>
                {when === 'later' && (
                  <input
                    className="adm-input" style={{ marginTop: 8 }} type="datetime-local"
                    value={toLocalInput(v.publishedAt)}
                    onChange={(e) => set('publishedAt')(e.target.value ? new Date(e.target.value).toISOString() : null)}
                  />
                )}
              </div>
            </div>
            {post?.publishedAt && (
              <div className="adm-muted small" style={{ marginTop: 6 }}>
                {new Date(post.publishedAt) > new Date() ? `Scheduled for ${fmtDate(post.publishedAt)}` : `First published ${fmtDate(post.publishedAt)}`}
              </div>
            )}

            <div className="pub-foot">
              <button type="button" className="adm-btn primary" disabled={saving} onClick={() => save('published')}>
                {saving ? 'Saving…' : publishLabel}
              </button>
            </div>
          </div>

          <div className="adm-card">
            <h3 className="adm-card-title">Categories</h3>
            <Categories selected={v.categories} known={known} onChange={set('categories')} />
          </div>

          <div className="adm-card">
            <h3 className="adm-card-title">Tags</h3>
            <Tags value={v.tags} onChange={set('tags')} />
          </div>

          <div className="adm-card">
            <h3 className="adm-card-title">Featured image</h3>
            <CoverImage value={v.coverImage} onChange={set('coverImage')} />
          </div>

          <div className="adm-card">
            <h3 className="adm-card-title">Excerpt</h3>
            <p className="adm-muted small" style={{ marginTop: -6 }}>Shown on the Insights listing under the title.</p>
            <textarea className="adm-input" rows={4} value={v.excerpt} onChange={setField('excerpt')} />
          </div>

          <div className="adm-card">
            <h3 className="adm-card-title">Post details</h3>
            <div className="adm-field full">
              <label className="adm-label">Author</label>
              <input className="adm-input" type="text" value={v.author} onChange={setField('author')} />
            </div>
            <div className="adm-field full">
              <label className="adm-label">Read time</label>
              <input className="adm-input" type="text" value={v.readTime} onChange={setField('readTime')} placeholder={`Auto: ${estimateRead(v.body)}`} />
            </div>
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
  const [filter, setFilter] = useState('all');

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

  const stateOf = (p) => {
    if (p.status !== 'published') return 'draft';
    if (p.visibility === 'private') return 'private';
    if (p.publishedAt && new Date(p.publishedAt) > new Date()) return 'scheduled';
    return 'published';
  };
  const LABEL = { draft: 'Draft', private: 'Private', scheduled: 'Scheduled', published: 'Published' };
  const counts = (posts || []).reduce((m, p) => { const s = stateOf(p); m[s] = (m[s] || 0) + 1; return m; }, {});
  const shown = (posts || []).filter((p) => filter === 'all' || stateOf(p) === filter);

  return (
    <>
      <PageHeader
        title="Blog posts"
        subtitle="Articles on the Insights page. Write, save as a draft, and publish when it is ready."
        actions={<button type="button" className="adm-btn primary" onClick={() => setEditing(null)}>Add new post</button>}
      />
      <ErrorNote error={error} onRetry={load} />
      {!posts && !error && <Loading />}
      {posts && posts.length > 0 && (
        <div className="post-filters">
          {['all', 'published', 'scheduled', 'draft', 'private'].map((f) => (
            (f === 'all' || counts[f]) ? (
              <button type="button" key={f} className={filter === f ? 'on' : ''} onClick={() => setFilter(f)}>
                {f === 'all' ? 'All' : LABEL[f]} <span>({f === 'all' ? posts.length : counts[f]})</span>
              </button>
            ) : null
          ))}
        </div>
      )}
      {posts && posts.length === 0 && (
        <div className="adm-card"><p className="adm-muted">No posts yet. Click <b>Add new post</b> to write the first one.</p></div>
      )}
      {posts && posts.length > 0 && (
        <div className="adm-card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="adm-table">
            <thead><tr><th>Title</th><th>Categories</th><th>Status</th><th>Date</th><th /></tr></thead>
            <tbody>
              {shown.map((p) => {
                const s = stateOf(p);
                return (
                  <tr key={p.id}>
                    <td><b>{p.title}</b><div className="adm-muted small">/insights/{p.slug}</div></td>
                    <td>{p.categories.join(', ') || '—'}</td>
                    <td><span className={`adm-pill ${s === 'published' ? 'ok' : ''}`}>{LABEL[s]}</span></td>
                    <td>{fmtDate(p.publishedAt)}</td>
                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      {s === 'published' && <a className="adm-btn small" href={`/insights/${p.slug}`} target="_blank" rel="noreferrer">View</a>}
                      <button type="button" className="adm-btn small" onClick={() => setEditing(p)}>Edit</button>
                      <button type="button" className="adm-icon-btn danger" aria-label="Delete" onClick={() => remove(p)}>&times;</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
