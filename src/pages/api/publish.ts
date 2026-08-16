import type { APIRoute } from 'astro';
import { fetchPhoto, fetchBrightPhoto, fetchPhotoById, composeCard, composeCover, getPexelsKey } from '../../lib/card';

export const prerender = false;

const ADMIN = () => process.env.ADMIN_SECRET || import.meta.env.ADMIN_SECRET;
const REPO = () => process.env.GITHUB_REPO || import.meta.env.GITHUB_REPO || 'moisematondo328/tutoria-blog';
const json = (d: unknown, s = 200) => new Response(JSON.stringify(d), { status: s, headers: { 'content-type': 'application/json' } });
const CATEGORIES = ['Santé & Bien-être', 'Développement Personnel', 'Finance & Investissement', 'Technologie Émergente'];

function getGithubToken(): string | undefined {
  const direct = process.env.GITHUB_TOKEN || import.meta.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  if (direct) return direct;
  for (const v of Object.values(process.env)) if (typeof v === 'string' && (v.startsWith('ghp_') || v.startsWith('github_pat_'))) return v;
  return undefined;
}
function slugify(s: string): string {
  return String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/['’]/g, ' ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80) || 'article';
}
function now() {
  const d = new Date(); const p = (n: number) => String(n).padStart(2, '0');
  return { ts: `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())} ${p(d.getUTCHours())}:${p(d.getUTCMinutes())}:${p(d.getUTCSeconds())}`, y: d.getUTCFullYear(), m: p(d.getUTCMonth() + 1) };
}
const fmEsc = (s: string) => String(s || '').replace(/"/g, '\\"');

const GH = (token: string) => ({ Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', 'User-Agent': 'tutoria-admin', 'content-type': 'application/json' });

async function ghExists(repo: string, path: string, token: string): Promise<boolean> {
  const r = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, { headers: GH(token) });
  return r.status === 200;
}

// Commit multi-fichiers en une fois (Git Data API).
async function commitFiles(repo: string, token: string, files: { path: string; base64: string }[], message: string): Promise<{ ok: boolean; detail?: string }> {
  const h = GH(token);
  try {
    const ref = await (await fetch(`https://api.github.com/repos/${repo}/git/ref/heads/main`, { headers: h })).json();
    const baseSha = ref.object?.sha;
    if (!baseSha) return { ok: false, detail: 'ref' };
    const baseCommit = await (await fetch(`https://api.github.com/repos/${repo}/git/commits/${baseSha}`, { headers: h })).json();
    const baseTree = baseCommit.tree?.sha;
    const tree: any[] = [];
    for (const f of files) {
      const blob = await (await fetch(`https://api.github.com/repos/${repo}/git/blobs`, { method: 'POST', headers: h, body: JSON.stringify({ content: f.base64, encoding: 'base64' }) })).json();
      if (!blob.sha) return { ok: false, detail: 'blob' };
      tree.push({ path: f.path, mode: '100644', type: 'blob', sha: blob.sha });
    }
    const newTree = await (await fetch(`https://api.github.com/repos/${repo}/git/trees`, { method: 'POST', headers: h, body: JSON.stringify({ base_tree: baseTree, tree }) })).json();
    if (!newTree.sha) return { ok: false, detail: 'tree' };
    const commit = await (await fetch(`https://api.github.com/repos/${repo}/git/commits`, { method: 'POST', headers: h, body: JSON.stringify({ message, tree: newTree.sha, parents: [baseSha] }) })).json();
    if (!commit.sha) return { ok: false, detail: 'commit' };
    const upd = await fetch(`https://api.github.com/repos/${repo}/git/refs/heads/main`, { method: 'PATCH', headers: h, body: JSON.stringify({ sha: commit.sha }) });
    return upd.ok ? { ok: true } : { ok: false, detail: 'ref-update' };
  } catch (e: any) { return { ok: false, detail: (e?.message || 'exception').slice(0, 120) }; }
}

export const POST: APIRoute = async ({ request }) => {
  let b: any; try { b = await request.json(); } catch { return json({ ok: false }, 400); }
  if (!ADMIN() || b.secret !== ADMIN()) return json({ ok: false }, 401);

  const token = getGithubToken();
  if (!token) return json({ ok: false, error: 'config' }, 500);

  const title = (b.title || '').toString().trim();
  const category = CATEGORIES.includes(b.category) ? b.category : 'Développement Personnel';
  const excerpt = (b.excerpt || '').toString().trim();
  let cover = (b.cover || '').toString().trim();
  let body = (b.body || '').toString();
  const draft = !!b.draft;
  let sections: any[] = Array.isArray(b.sections) ? b.sections : [];
  if (title.length < 4 || body.trim().length < 40) return json({ ok: false, error: 'champs' }, 400);

  // Repli : pas de métadonnées de sections (page admin ancienne, article manuel…) ->
  // on dérive une carte par titre "## …" du corps (kicker vide, requête = le titre).
  if (!sections.length) {
    const heads = (body.match(/^##\s+(.+)$/gm) || []).map((h: string) => h.replace(/^##\s+/, '').trim());
    sections = heads.map((h: string) => ({ kicker: '', cardTitle: h.length > 42 ? h.slice(0, 40).trim() : h, imageQuery: h }));
  }

  const repo = REPO();
  let slug = slugify(title);
  if (await ghExists(repo, `src/content/blog/${slug}.md`, token)) slug = `${slug}-${Date.now().toString(36).slice(-4)}`;
  const { ts, y, m } = now();
  const dir = `public/uploads/${y}/${m}`;

  const files: { path: string; base64: string }[] = [];
  const pexelsKey = getPexelsKey();
  const usedIds = new Set<number>(); // anti-doublon : chaque visuel a une photo différente
  const figures: string[] = [];

  // 1) Couverture d'aperçu (SANS texte). Photo choisie dans /admin (coverPhotoId) sinon auto.
  if (pexelsKey && !cover) {
    const cq = (b.coverQuery || title).toString();
    const cp = b.coverPhotoId ? await fetchPhotoById(pexelsKey, b.coverPhotoId) : await fetchBrightPhoto(pexelsKey, cq, usedIds);
    if (cp) {
      usedIds.add(cp.id);
      const cbuf = await composeCover(cp.buf);
      if (cbuf) {
        const cf = `${slug}-cover.webp`;
        files.push({ path: `${dir}/${cf}`, base64: cbuf.toString('base64') });
        cover = `/uploads/${y}/${m}/${cf}`;
      }
    }
  }

  // 2) Une carte par section, chacune avec une photo différente (séquentiel pour l'anti-doublon)
  if (pexelsKey && sections.length) {
    for (let i = 0; i < sections.length; i++) {
      const s = sections[i];
      const p = s.photoId
        ? await fetchPhotoById(pexelsKey, s.photoId)
        : await fetchPhoto(pexelsKey, (s.imageQuery || s.cardTitle || s.heading || '').toString(), 'square', usedIds);
      if (!p) { figures[i] = ''; continue; }
      usedIds.add(p.id);
      const cbuf = await composeCard(p.buf, (s.kicker || '').toString(), (s.cardTitle || s.heading || '').toString());
      if (!cbuf) { figures[i] = ''; continue; }
      const fname = `${slug}-${i + 1}.webp`;
      files.push({ path: `${dir}/${fname}`, base64: cbuf.toString('base64') });
      figures[i] = `<figure class="wp-block-image size-full"><img src="/uploads/${y}/${m}/${fname}" alt="${fmEsc((s.cardTitle || s.heading || '').toString())}" loading="lazy"/></figure>`;
    }
  }

  // 2) Insérer chaque figure après le titre de section correspondant (par ordre)
  if (figures.length) {
    let idx = 0;
    body = body.replace(/^##\s+.+$/gm, (line: string) => {
      const fig = figures[idx]; idx++;
      return fig ? `${line}\n\n${fig}` : line;
    });
  }

  // 3) Fichier Markdown de l'article
  const md = [
    '---',
    `title: "${fmEsc(title)}"`,
    `date: "${ts}"`,
    `category: "${category}"`,
    `excerpt: "${fmEsc(excerpt)}"`,
    `cover: "${fmEsc(cover)}"`,
    `draft: ${draft}`,
    '---',
    '',
    body.trim(),
    '',
  ].join('\n');
  files.push({ path: `src/content/blog/${slug}.md`, base64: Buffer.from(md, 'utf8').toString('base64') });

  // 4) Un seul commit pour l'article + toutes ses images
  const r = await commitFiles(repo, token, files, `article: ${title}`);
  if (!r.ok) return json({ ok: false, error: 'github', detail: r.detail }, 502);
  return json({ ok: true, slug, draft, images: files.length - 1, url: `https://tutoria-blog.vercel.app/blog/${slug}/` });
};
