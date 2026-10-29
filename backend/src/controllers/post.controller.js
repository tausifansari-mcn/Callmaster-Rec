import { Posts } from '../repositories/posts.js';
import { ApiError, asyncHandler } from '../utils/ApiError.js';

const found = (row) => {
  if (!row) throw ApiError.notFound('Post not found');
  return row;
};

/**
 * The editor produces HTML, which is rendered into the page. Only an authenticated admin can write
 * it, but strip the tags that turn stored content into script execution anyway — a defence against
 * a pasted payload or a compromised admin account.
 */
function sanitise(html) {
  return String(html || '')
    .replace(/<\s*(script|iframe|object|embed|style|link|meta)\b[\s\S]*?<\s*\/\s*\1\s*>/gi, '')
    .replace(/<\s*(script|iframe|object|embed|style|link|meta)\b[^>]*\/?>/gi, '')
    // inline handlers: onclick=, onerror=… in either quote style or bare
    .replace(/\son\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/(href|src)\s*=\s*(["']?)\s*javascript:[^"'\s>]*\2/gi, '$1="#"');
}

const clean = (body) => ({ ...body, body: sanitise(body.body) });

// ---------------------------------------------------------------- public
/** Published posts, newest first, without the body — enough to render the listing. */
export const listPublicPosts = asyncHandler(async (_req, res) => {
  const posts = await Posts.listPublished();
  res.json(posts.map(({ body, ...rest }) => rest));
});

export const getPublicPost = asyncHandler(async (req, res) => {
  res.json(found(await Posts.findPublishedBySlug(req.params.slug)));
});

// ---------------------------------------------------------------- admin
export const listPosts = asyncHandler(async (_req, res) => res.json(await Posts.listAll()));

/** Categories already in use, so the editor can offer them as a checkbox list. */
export const listPostCategories = asyncHandler(async (_req, res) => res.json(await Posts.categoryNames()));

export const getPost = asyncHandler(async (req, res) => res.json(found(await Posts.findById(req.params.id))));

export const createPost = asyncHandler(async (req, res) => {
  if (await Posts.slugTaken(req.body.slug)) throw ApiError.conflict(`The link "${req.body.slug}" is already used by another post`);
  res.status(201).json(await Posts.create(clean(req.body)));
});

export const updatePost = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  found(await Posts.findById(id));
  if (await Posts.slugTaken(req.body.slug, id)) throw ApiError.conflict(`The link "${req.body.slug}" is already used by another post`);
  res.json(await Posts.update(id, clean(req.body)));
});

export const deletePost = asyncHandler(async (req, res) => {
  found(await Posts.findById(req.params.id));
  await Posts.remove(req.params.id);
  res.status(204).end();
});
