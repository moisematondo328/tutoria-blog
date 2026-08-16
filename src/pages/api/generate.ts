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

STRUCTURE :
- Une intro courte qui accroche (2 à 4 phrases, pose le problème concret).
- 3 à 5 SECTIONS. Chaque section a un titre, un contenu (Markdown, exemples concrets, listes si utile), et sert à ILLUSTRER (une image sera posée après le titre).
- Une conclusion actionnable (que faire maintenant).
- Longueur totale : 600 à 900 mots. Pas de titre H1.

Pour CHAQUE section, tu fournis aussi de quoi fabriquer sa carte-image :
- "kicker" : un libellé TRÈS COURT EN MAJUSCULES (1 à 2 mots, il s'affiche dans une petite pastille). Si l'article est une liste d'étapes/astuces, mets "ÉTAPE 1", "ÉTAPE 2"… dans l'ordre. Sinon un libellé thématique court (ex : "LE PRINCIPE", "À RETENIR", "L'ERREUR", "LES APPLIS").
- "cardTitle" : un titre TRÈS court (2 à 4 mots) qui résume la section (ex : "Créer une routine").
- "imageQuery" : mots-clés EN ANGLAIS pour une VRAIE PHOTO (jamais un rendu 3D ni une illustration). RÈGLES :
  1) mets TOUJOURS une PERSONNE en train de faire l'action PRÉCISE de CETTE section (un objet seul comme "smartphone", "sim card", "money" renvoie des rendus 3D moches et hors sujet) ;
  2) sois SPÉCIFIQUE au contenu de la section, pas générique (chaque section doit avoir une image différente et parlante) ;
  3) personnes noires / contexte africain quand c'est logique.
  Ex. section "applis anti-spam" -> "african woman checking app on phone". Ex. section "recours juridique" -> "worried woman talking to lawyer". À ÉVITER absolument : "smartphone", "sim card", "justice", "success". 4 à 6 mots.

En plus, fournis "coverQuery" : mots-clés EN ANGLAIS pour la PHOTO DE COUVERTURE (une personne, scène concrète et lumineuse, la plus représentative du sujet global). Mêmes règles.

RUBRIQUE : choisis EXACTEMENT une valeur parmi : ${CATEGORIES.map((c) => `"${c}"`).join(', ')}.

SUJET : "${topic}"

Réponds UNIQUEMENT en JSON valide, sans texte autour :
{
  "title": "titre accrocheur mais honnête, 50-70 caractères",
  "excerpt": "résumé SEO d'1 à 2 phrases (max 160 caractères)",
  "category": "une des 4 rubriques exactes",
  "coverQuery": "english keywords (scène concrète pour la couverture)",
  "intro": "intro en Markdown (sans titre)",
  "sections": [
    { "heading": "titre de la section", "kicker": "ÉTAPE 1", "cardTitle": "2 à 4 mots", "imageQuery": "english keywords", "content": "contenu de la section en Markdown, sans le titre" }
  ],
  "conclusion": "conclusion en Markdown (peut commencer par '## ...')"
}`;
}

export const POST: APIRoute = async ({ request }) => {
  let b: any; try { b = await request.json(); } catch { return json({ ok: false }, 400); }
  if (!ADMIN() || b.secret !== ADMIN()) return json({ ok: false }, 401);
  const topic = (b.topic || '').toString().trim();
  if (topic.length < 4) return json({ ok: false, error: 'sujet' }, 400);

  const key = getGeminiKey();
  if (!key) return json({ ok: false, error: 'config' }, 500);

  // Repli sur plusieurs modèles : évite déprécation (404) et surcharge (503).
  const MODELS = ['gemini-3.5-flash', 'gemini-flash-latest', 'gemini-3.6-flash'];
  const reqBody = JSON.stringify({
    contents: [{ parts: [{ text: buildPrompt(topic) }] }],
    generationConfig: { responseMimeType: 'application/json', temperature: 0.75, maxOutputTokens: 4096 },
  });
  let data: any = null, lastErr = '';
  for (const model of MODELS) {
    let res: Response;
    try {
      res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
        { method: 'POST', headers: { 'content-type': 'application/json' }, body: reqBody });
    } catch { lastErr = 'reseau'; continue; }
    if (res.ok) { data = await res.json(); break; }
    lastErr = (await res.text().catch(() => '')).slice(0, 150);
    if (res.status !== 404 && res.status !== 503) break; // erreur non récupérable (clé, quota…)
  }
  if (!data) return json({ ok: false, error: 'gemini', detail: lastErr }, 502);
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  let art: any;
  try { art = JSON.parse(text); } catch { return json({ ok: false, error: 'parse', raw: text.slice(0, 300) }, 502); }

  // garde-fous : rubrique valide + purge de tout tiret cadratin résiduel
  if (!CATEGORIES.includes(art.category)) art.category = 'Développement Personnel';
  const clean = (s: any) => String(s || '').replace(/[—–]/g, ', ');

  const rawSections = Array.isArray(art.sections) ? art.sections : [];
  // Corps Markdown = intro + (## titre + contenu) par section + conclusion.
  let body = clean(art.intro).trim();
  for (const s of rawSections) {
    body += `\n\n## ${clean(s.heading).trim()}\n\n${clean(s.content).trim()}`;
  }
  if (art.conclusion) body += `\n\n${clean(art.conclusion).trim()}`;

  return json({
    ok: true,
    article: {
      title: clean(art.title).slice(0, 120),
      excerpt: clean(art.excerpt).slice(0, 200),
      category: art.category,
      coverQuery: (art.coverQuery || '').toString().slice(0, 80),
      body: body.trim(),
      sections: rawSections.map((s: any) => ({
        heading: clean(s.heading).trim().slice(0, 120),
        kicker: clean(s.kicker).trim().toUpperCase().slice(0, 22),
        cardTitle: clean(s.cardTitle).trim().slice(0, 42),
        imageQuery: (s.imageQuery || '').toString().slice(0, 80),
      })),
    },
  });
};
