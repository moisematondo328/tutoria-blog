import fs from 'node:fs';
import path from 'node:path';

const postsPath = process.argv[2];
const outDir = process.argv[3];
const posts = JSON.parse(fs.readFileSync(postsPath, 'utf8'));

fs.mkdirSync(outDir, { recursive: true });

const decode = (s) =>
  (s || '')
    .replace(/&amp;/g, '&')
    .replace(/&#8217;|&#8216;/g, '’')
    .replace(/&#8220;|&#8221;/g, '"')
    .replace(/&#8230;/g, '…')
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"');

const slugify = (s) =>
  decode(s)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');

const PILLARS = {
  'sante-bien-etre': 'Santé & Bien-être',
  'developpement-personnel': 'Développement Personnel',
  'finance-investissement': 'Finance & Investissement',
  'technologie-emergente': 'Technologie Émergente',
};

function excerptFrom(content, wpExcerpt) {
  const base = wpExcerpt && wpExcerpt.trim() ? wpExcerpt : content;
  const text = decode(base.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')).trim();
  return text.slice(0, 165).replace(/\s+\S*$/, '') + (text.length > 165 ? '…' : '');
}

// Réécrit les anciens liens tutorianews.net vers les nouvelles routes internes
function rewriteInternalLinks(html, slugSet) {
  return html.replace(/https?:\/\/(?:www\.)?tutorianews\.net(\/[^\s"'<>)]*)?/g, (_m, p) => {
    const segs = (p || '/').split('/').filter(Boolean).map((s) => s);
    if (!segs.length) return '/';
    if (segs[0] === 'category' && PILLARS[segs[1]]) return `/categorie/${segs[1]}/`;
    if (segs.includes('livres') || segs[0] === 'qui-sommes-nous') return '/livres/';
    if (segs[0] === 'blogs') return '/articles/';
    if (segs[0] === 'tag') return '/articles/';
    // permalien article (avec ou sans préfixe de date)
    const last = segs[segs.length - 1];
    let s;
    try { s = slugify(decodeURIComponent(last)); } catch { s = slugify(last); }
    if (slugSet.has(s)) return `/blog/${s}/`;
    return '/';
  });
}

// Ouvre les liens externes dans un nouvel onglet, en sécurité
function secureExternalLinks(html) {
  return html.replace(/<a\s+([^>]*?)href="(https?:\/\/[^"]+)"([^>]*)>/gi, (m, pre, url, post) => {
    if (/(^|\/\/)([^/]*\.)?tutorianews\.net/.test(url)) return m;
    if (/target=/.test(pre + post)) return m;
    return `<a ${pre}href="${url}"${post} target="_blank" rel="noopener noreferrer nofollow">`;
  });
}

function cleanContent(html, slugSet) {
  return secureExternalLinks(
    rewriteInternalLinks(
      html
        .replace(/<!--\s*\/?wp:[^>]*?-->/g, '')
        .replace(/https?:\/\/(www\.)?tutorianews\.net\/wp-content\/uploads\//g, '/uploads/'),
      slugSet
    )
  )
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

const yaml = (v) => '"' + String(v).replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';

// --- Passe 1 : calculer tous les slugs ---
const seen = new Set();
const built = [];
for (const p of posts) {
  let slug = slugify(decodeURIComponent(p.slug || '')) || slugify(p.title);
  if (!slug) continue;
  while (seen.has(slug)) slug += '-2';
  seen.add(slug);
  let catSlug = '';
  for (const c of p.categories) { const s = slugify(c); if (PILLARS[s]) { catSlug = s; break; } }
  if (!catSlug && p.categories[0]) catSlug = slugify(p.categories[0]);
  built.push({ p, slug, catSlug, catName: PILLARS[catSlug] || decode(p.categories[0] || 'Actualités') });
}
const slugSet = new Set(built.map((b) => b.slug));

// --- Passe 2 : écrire, avec réécriture des liens internes ---
let count = 0;
for (const { p, slug, catSlug, catName } of built) {
  const cover = (p.cover || '').replace(/https?:\/\/(www\.)?tutorianews\.net\/wp-content\/uploads\//g, '/uploads/');
  const fm = [
    '---',
    `title: ${yaml(decode(p.title).trim())}`,
    `date: ${yaml(p.date)}`,
    `category: ${yaml(catName)}`,
    `categorySlug: ${yaml(catSlug)}`,
    `excerpt: ${yaml(excerptFrom(p.content, p.excerpt))}`,
    `cover: ${yaml(cover)}`,
    '---',
    '',
  ].join('\n');
  fs.writeFileSync(path.join(outDir, slug + '.md'), fm + cleanContent(p.content, slugSet) + '\n', 'utf8');
  count++;
}
console.log('✅', count, 'articles écrits (liens internes réécrits) ->', outDir);
