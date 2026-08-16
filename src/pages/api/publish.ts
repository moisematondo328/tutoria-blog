import type { APIRoute } from 'astro';

export const prerender = false;

const ADMIN = () => process.env.ADMIN_SECRET || import.meta.env.ADMIN_SECRET;
const REPO = () => process.env.GITHUB_REPO || import.meta.env.GITHUB_REPO || 'moisematondo328/tutoria-blog';
const json = (d: unknown, s = 200) => new Response(JSON.stringify(d), { status: s, headers: { 'content-type': 'application/json' } });

const CATEGORIES = ['Santé & Bien-être', 'Développement Personnel', 'Finance & Investissement', 'Technologie Émergente'];

function getGithubToken(): string | undefined {
  const direct = process.env.GITHUB_TOKEN || import.meta.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  if (direct) return direct;
  for (const v of Object.values(process.env)) {
    if (typeof v === 'string' && (v.startsWith('ghp_') || v.startsWith('github_pat_'))) return v;
  }
  return undefined;
}

function slugify(s: string): string {
  return String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/['’]/g, ' ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80) || 'article';
}
function now() {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())} ${p(d.getUTCHours())}:${p(d.getUTCMinutes())}:${p(d.getUTCSeconds())}`;
}
const esc = (s: string) => String(s || '').replace(/"/g, '\\"');

async function ghExists(repo: string, path: string, token: string): Promise<boolean> {
  const r = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', 'User-Agent': 'tutoria-admin' },
  });
  return r.status === 200;
}

export const POST: APIRoute = async ({ request }) => {
  let b: any; try { b = await request.json(); } catch { return json({ ok: false }, 400); }
  if (!ADMIN() || b.secret !== ADMIN()) return json({ ok: false }, 401);

  const token = getGithubToken();
  if (!token) return json({ ok: false, error: 'config' }, 500);

  const title = (b.title || '').toString().trim();
  const category = CATEGORIES.includes(b.category) ? b.category : 'Développement Personnel';
  const excerpt = (b.excerpt || '').toString().trim();
  const cover = (b.cover || '').toString().trim();
  const body = (b.body || '').toString().trim();
  const draft = !!b.draft;
  if (title.length < 4 || body.length < 40) return json({ ok: false, error: 'champs' }, 400);

  const repo = REPO();
  let slug = slugify(title);
  const path0 = `src/content/blog/${slug}.md`;
  if (await ghExists(repo, path0, token)) slug = `${slug}-${Date.now().toString(36).slice(-4)}`;
  const path = `src/content/blog/${slug}.md`;

  const frontmatter = [
    '---',
    `title: "${esc(title)}"`,
    `date: "${now()}"`,
    `category: "${category}"`,
    `excerpt: "${esc(excerpt)}"`,
    `cover: "${esc(cover)}"`,
    `draft: ${draft}`,
    '---',
    '',
  ].join('\n');
  const content = frontmatter + body + '\n';
  const b64 = Buffer.from(content, 'utf8').toString('base64');

  const put = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', 'User-Agent': 'tutoria-admin', 'content-type': 'application/json' },
    body: JSON.stringify({ message: `article: ${title}`, content: b64 }),
  });
  if (!(put.status === 201 || put.status === 200)) {
    const e = await put.text().catch(() => '');
    return json({ ok: false, error: 'github', detail: e.slice(0, 200) }, 502);
  }
  return json({ ok: true, slug, draft, url: `https://tutoria-blog.vercel.app/blog/${slug}/` });
};
