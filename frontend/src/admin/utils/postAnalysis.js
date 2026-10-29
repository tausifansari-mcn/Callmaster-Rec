/**
 * Writing-quality checks shown beside the post editor — the equivalent of the SEO and Readability
 * panels in a WordPress SEO plugin. Each check returns { level, text } where level is
 * 'good' | 'ok' | 'bad'. Everything is computed in the browser from what is typed; nothing is sent
 * anywhere.
 *
 * These are heuristics, not guarantees about ranking. They flag common, fixable problems.
 */

const stripHtml = (html) => String(html || '')
  .replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ')
  .replace(/<[^>]*>/g, ' ')
  .replace(/&nbsp;/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const words = (text) => (text ? text.split(/\s+/).filter(Boolean) : []);
const norm = (s) => String(s || '').toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu, ' ').replace(/\s+/g, ' ').trim();

/** How many times `phrase` occurs in `text`, as whole words. */
export function countPhrase(text, phrase) {
  const p = norm(phrase);
  if (!p) return 0;
  const hay = ` ${norm(text)} `;
  let n = 0;
  let i = hay.indexOf(` ${p} `);
  while (i !== -1) { n++; i = hay.indexOf(` ${p} `, i + p.length); }
  return n;
}

const sentences = (text) => text.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter((s) => words(s).length > 0);

/** A rough syllable count — good enough for a reading-ease estimate, not for linguistics. */
const syllables = (word) => {
  const w = word.toLowerCase().replace(/[^a-z]/g, '');
  if (!w) return 0;
  if (w.length <= 3) return 1;
  const groups = w.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '').replace(/^y/, '').match(/[aeiouy]{1,2}/g);
  return Math.max(1, groups ? groups.length : 1);
};

/** Flesch reading ease: higher is easier. ~60+ is plain English. */
export function readingEase(text) {
  const w = words(text);
  const s = sentences(text);
  if (w.length < 20 || !s.length) return null;
  const syl = w.reduce((n, x) => n + syllables(x), 0);
  return 206.835 - 1.015 * (w.length / s.length) - 84.6 * (syl / w.length);
}

const good = (text) => ({ level: 'good', text });
const ok = (text) => ({ level: 'ok', text });
const bad = (text) => ({ level: 'bad', text });

/** SEO checks. `post` is the editor state. */
export function analyseSeo(post) {
  const key = norm(post.focusKeyphrase);
  const text = stripHtml(post.body);
  const wc = words(text).length;
  const title = post.seoTitle || post.title || '';
  const desc = post.seoDescription || post.excerpt || '';
  const out = [];

  if (!key) {
    out.push(bad('Set a focus keyphrase — the main phrase you want this post to be found for. The keyphrase checks below need it.'));
  }

  if (key) {
    const first = words(text).slice(0, 120).join(' ');
    out.push(norm(title).includes(key)
      ? good('The focus keyphrase appears in the SEO title.')
      : bad('The focus keyphrase does not appear in the SEO title. Search engines weigh the title heavily.'));

    out.push(norm(desc).includes(key)
      ? good('The focus keyphrase appears in the meta description.')
      : ok('The focus keyphrase is not in the meta description. Adding it makes the result look more relevant.'));

    out.push(norm(post.slug).replace(/-/g, ' ').includes(key.replace(/-/g, ' '))
      ? good('The focus keyphrase appears in the post address.')
      : ok('The focus keyphrase is not in the post address.'));

    out.push(norm(first).includes(key)
      ? good('The focus keyphrase appears in the opening of the post.')
      : bad('The focus keyphrase is missing from the first paragraph. Mention it early.'));

    const uses = countPhrase(text, key);
    const density = wc ? (uses * words(key).length * 100) / wc : 0;
    if (uses === 0) out.push(bad('The focus keyphrase is not used in the post body at all.'));
    else if (density > 3) out.push(bad(`The focus keyphrase is used ${uses} times (${density.toFixed(1)}% of the text). That reads as stuffing — ease off.`));
    else if (density < 0.3 && wc > 150) out.push(ok(`The focus keyphrase is used ${uses} time${uses === 1 ? '' : 's'}. Using it a little more often would help.`));
    else out.push(good(`The focus keyphrase is used ${uses} time${uses === 1 ? '' : 's'} (${density.toFixed(1)}%) — a natural amount.`));

    const heads = (String(post.body).match(/<h[2-4][^>]*>[\s\S]*?<\/h[2-4]>/gi) || []).map(stripHtml);
    if (heads.length) {
      out.push(heads.some((h) => norm(h).includes(key))
        ? good('The focus keyphrase appears in at least one subheading.')
        : ok('The focus keyphrase is not in any subheading.'));
    }
  }

  if (wc < 300) out.push(bad(`The post is ${wc} words. Aim for at least 300 so it can rank for anything.`));
  else out.push(good(`The post is ${wc} words — a solid length.`));

  const t = title.length;
  if (!t) out.push(bad('There is no SEO title.'));
  else if (t > 60) out.push(ok(`The SEO title is ${t} characters; Google usually cuts off around 60.`));
  else if (t < 30) out.push(ok(`The SEO title is only ${t} characters — there is room to be more descriptive.`));
  else out.push(good(`The SEO title is ${t} characters — a good length.`));

  const d = desc.length;
  if (!d) out.push(bad('There is no meta description, so Google will pick a snippet itself.'));
  else if (d > 160) out.push(ok(`The meta description is ${d} characters; Google usually cuts off around 160.`));
  else if (d < 70) out.push(ok(`The meta description is only ${d} characters — you can say more.`));
  else out.push(good(`The meta description is ${d} characters — a good length.`));

  const links = String(post.body).match(/<a\s[^>]*href=/gi) || [];
  out.push(links.length
    ? good(`The post links out or to other pages (${links.length} link${links.length === 1 ? '' : 's'}).`)
    : ok('The post has no links. Linking to related pages helps readers and search engines.'));

  const imgs = String(post.body).match(/<img\b[^>]*>/gi) || [];
  if (imgs.length || post.coverImage) {
    const missingAlt = imgs.filter((i) => !/\balt\s*=\s*"[^"]+"/i.test(i)).length;
    out.push(missingAlt ? ok(`${missingAlt} image${missingAlt === 1 ? ' has' : 's have'} no alt text, which hurts accessibility and image search.`) : good('The images have alt text.'));
  } else {
    out.push(ok('The post has no images. A picture usually helps engagement.'));
  }
  return out;
}

/** Readability checks. */
export function analyseReadability(post) {
  const text = stripHtml(post.body);
  const w = words(text);
  const out = [];
  if (w.length < 20) {
    return [ok('Write a little more — there is not enough text to assess readability yet.')];
  }

  const ease = readingEase(text);
  if (ease != null) {
    if (ease >= 60) out.push(good(`Reading ease is ${Math.round(ease)} — easy to read.`));
    else if (ease >= 40) out.push(ok(`Reading ease is ${Math.round(ease)} — fairly difficult. Shorter sentences and plainer words would help.`));
    else out.push(bad(`Reading ease is ${Math.round(ease)} — hard going. Shorten sentences and simplify wording.`));
  }

  const s = sentences(text);
  const long = s.filter((x) => words(x).length > 25).length;
  const pctLong = (long * 100) / s.length;
  if (pctLong > 25) out.push(bad(`${Math.round(pctLong)}% of sentences are over 25 words. Aim for under 25%.`));
  else if (pctLong > 10) out.push(ok(`${Math.round(pctLong)}% of sentences are over 25 words.`));
  else out.push(good('Sentence length is comfortable.'));

  const paras = (String(post.body).match(/<p[^>]*>[\s\S]*?<\/p>/gi) || []).map(stripHtml);
  const longParas = paras.filter((p) => words(p).length > 150).length;
  out.push(longParas
    ? ok(`${longParas} paragraph${longParas === 1 ? ' is' : 's are'} over 150 words. Break them up.`)
    : good('Paragraph length is comfortable.'));

  const heads = String(post.body).match(/<h[2-4][^>]*>/gi) || [];
  if (w.length > 300) {
    out.push(heads.length
      ? good(`The text is broken up with ${heads.length} subheading${heads.length === 1 ? '' : 's'}.`)
      : bad('There are no subheadings. Break a long post into sections.'));
  }

  // Runs of sentences that open with the same word read as repetitive.
  let run = 1; let worst = 1;
  for (let i = 1; i < s.length; i++) {
    const a = words(s[i - 1])[0]?.toLowerCase();
    const b = words(s[i])[0]?.toLowerCase();
    run = a && a === b ? run + 1 : 1;
    worst = Math.max(worst, run);
  }
  out.push(worst >= 3
    ? ok(`${worst} sentences in a row start with the same word. Vary the openings.`)
    : good('Sentence openings are varied.'));

  const passive = s.filter((x) => /\b(is|are|was|were|been|being|be)\s+\w+(ed|en)\b/i.test(x)).length;
  const pctPassive = (passive * 100) / s.length;
  out.push(pctPassive > 25
    ? ok(`${Math.round(pctPassive)}% of sentences look passive. Active voice is usually clearer.`)
    : good('Active voice dominates.'));
  return out;
}

/** The worst level in a list — drives the red/amber/green dot on the panel. */
export const overall = (checks) => (checks.some((c) => c.level === 'bad') ? 'bad' : checks.some((c) => c.level === 'ok') ? 'ok' : 'good');
export const wordCount = (html) => words(stripHtml(html)).length;
export { stripHtml };
