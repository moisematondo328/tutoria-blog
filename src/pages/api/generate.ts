import type { APIRoute } from 'astro';

export const prerender = false;

const ADMIN = () => process.env.ADMIN_SECRET || import.meta.env.ADMIN_SECRET;
const json = (d: unknown, s = 200) => new Response(JSON.stringify(d), { status: s, headers: { 'content-type': 'application/json' } });

// Clé Gemini par son nom, sinon par son format (AIza…).
function getGeminiKey(): string | undefined {
  const direct = process.env.GEMINI_API_KEY || import.meta.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (direct) return direct;
  for (const v of Object.values(process.env)) {
    if (typeof v === 'string' && v.startsWith('AIza')) return v;
  }
  return undefined;
}

const CATEGORIES = ['Santé & Bien-être', 'Développement Personnel', 'Finance & Investissement', 'Technologie Émergente'];

function buildPrompt(topic: string): string {
  return `Tu es le rédacteur de Tutoria News, un média éducatif francophone (Afrique). Ta mission : écrire un article clair et pratique sur le sujet donné, dans la voix de Tutoria.

VOIX TUTORIA (à respecter absolument) :
- Tutoiement, ton chaleureux mais sérieux, phrases courtes et directes.
- Concret : des exemples, des chiffres, des étapes applicables tout de suite.
- Devise : "tu lis, tu comprends, tu appliques".
- Public : lecteurs francophones, souvent en Afrique, qui veulent des conseils utiles.

INTERDICTIONS STRICTES (sinon l'article est rejeté) :
- AUCUN tiret cadratin "—" ni demi-cadratin "–". Utilise des points, des virgules, ou deux-points.
- Pas de formules creuses ("Dans un monde où", "De nos jours", "Il est important de noter", "N'hésitez pas", "En conclusion").
- Pas d'emoji. Pas de langue de bois. Pas de remplissage.
- Écris comme un humain qui explique à un ami, pas comme une IA.

STRUCTURE de l'article (corps en Markdown) :
- Une intro courte qui accroche (2 à 4 phrases, pose le problème concret).
- 3 à 5 sections avec des sous-titres "## ...".
- Des exemples concrets, listes à puces quand utile.
- Une conclusion actionnable (que faire maintenant).
- Longueur : 600 à 900 mots. Pas de titre H1 dans le corps (le titre est à part).

RUBRIQUE : choisis EXACTEMENT une valeur parmi : ${CATEGORIES.map((c) => `"${c}"`).join(', ')}.

SUJET : "${topic}"

Réponds UNIQUEMENT en JSON valide, sans texte autour, avec ce format :
{
  "title": "un titre accrocheur mais honnête (pas putaclic), 50-70 caractères",
  "excerpt": "un résumé SEO d'1 à 2 phrases (max 160 caractères)",
  "category": "une des 4 rubriques exactes ci-dessus",
  "body": "le corps de l'article en Markdown",
  "imageQuery": "2 à 4 mots-clés en anglais pour trouver une image d'illustration"
}`;
}

export const POST: APIRoute = async ({ request }) => {
  let b: any; try { b = await request.json(); } catch { return json({ ok: false }, 400); }
  if (!ADMIN() || b.secret !== ADMIN()) return json({ ok: false }, 401);
  const topic = (b.topic || '').toString().trim();
  if (topic.length < 4) return json({ ok: false, error: 'sujet' }, 400);

  const key = getGeminiKey();
  if (!key) return json({ ok: false, error: 'config' }, 500);

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`;
  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: buildPrompt(topic) }] }],
        generationConfig: { responseMimeType: 'application/json', temperature: 0.75, maxOutputTokens: 4096 },
      }),
    });
  } catch { return json({ ok: false, error: 'reseau' }, 502); }

  if (!res.ok) {
    const e = await res.text().catch(() => '');
    return json({ ok: false, error: 'gemini', detail: e.slice(0, 200) }, 502);
  }
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  let art: any;
  try { art = JSON.parse(text); } catch { return json({ ok: false, error: 'parse', raw: text.slice(0, 300) }, 502); }

  // garde-fous : rubrique valide + purge de tout tiret cadratin résiduel
  if (!CATEGORIES.includes(art.category)) art.category = 'Développement Personnel';
  const clean = (s: string) => String(s || '').replace(/[—–]/g, ', ');
  return json({
    ok: true,
    article: {
      title: clean(art.title).slice(0, 120),
      excerpt: clean(art.excerpt).slice(0, 200),
      category: art.category,
      body: clean(art.body),
      imageQuery: (art.imageQuery || '').toString().slice(0, 80),
    },
  });
};
