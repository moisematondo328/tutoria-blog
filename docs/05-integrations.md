# 5 — Intégrations

> Toutes les clés vivent dans **Vercel → Settings → Environment Variables** (jamais dans le dépôt).
> Le site est **statique-first** ; seules les routes `export const prerender = false` (API + pages
> compte) tournent en fonction serverless.

## Actives

### Stockage — Redis / Upstash (`src/lib/store.ts`)
- Couche agnostique au préfixe : retrouve les variables quel que soit leur nom (`KV_*`, `UPSTASH_*`,
  `REDIS_URL`…). Mode REST (`@upstash/redis`) ou natif (`ioredis`).
- Sert : **comptes, sessions, jetons, progression** (voir Data Dictionary), et les commentaires du blog.
- Helpers : `getJSON`, `setJSON`, `setJSONEx` (TTL), `del`, `hasStore`.

### E-mail — Brevo (`src/lib/brevo.ts`, `src/lib/auth.ts`)
- Transactionnel (`/v3/smtp/email`) : **vérification e-mail**, **réinitialisation mot de passe**,
  e-mail de bienvenue newsletter. Gabarits à la charte Academy.
- Campagnes (`/v3/emailCampaigns`) : diffusion d'articles à la liste #3.
- Clé : `BREVO_API_KEY` (`xkeysib-…`, retrouvée aussi par format). Expéditeur vérifié
  `tutorianews@gmail.com` (nom d'affichage « Tutoria Academy » pour les mails de compte).

### Authentification — maison + Google OAuth (`src/lib/auth.ts`)
- E-mail + mot de passe : hachage **scrypt** (Node crypto, sans dépendance), sessions cookie
  httpOnly + Redis.
- **Google OAuth** : flux code manuel (pas de lib). Nécessite `GOOGLE_CLIENT_ID` +
  `GOOGLE_CLIENT_SECRET` et l'URI de redirection `https://<domaine>/api/auth/google/callback`
  autorisée dans Google Cloud Console. Absents → le bouton Google renvoie une erreur propre,
  l'e-mail+mdp continue de marcher.

### Formulaire de contact — Web3Forms
- `/academy/contact/` poste en `fetch` vers `api.web3forms.com/submit` avec la clé d'accès
  `bdb279ee-…`. Réponse JSON, confirmation sans quitter l'Academy.

### Banques d'images — Pexels + Pixabay (back-office `/admin`)
- `PEXELS_API_KEY`, `PIXABAY_API_KEY`. Sélecteur d'images mixte pour fabriquer les cartes-images
  des articles générés (sharp). Images IA de Pixabay filtrées.

### Rédaction IA — Gemini (back-office `/admin`)
- `GEMINI_API_KEY` (`AIza…`). Onglet « Créer » : génère un article structuré.

### Publication — GitHub (`/api/publish`)
- `GITHUB_TOKEN` (droit *contents* sur `moisematondo328/tutoria-blog`). Commit article + images.

### Hébergement / mesure — Vercel
- Adaptateur `@astrojs/vercel` (`maxDuration: 60`). Auto-deploy à chaque push sur `main`.
- **Analytics** : GA4 (`G-C4VSWCY4HC`), Vercel Analytics + **Speed Insights** (`<SpeedInsights/>` rendu).
  Sitemap (`@astrojs/sitemap`). Open Graph + Twitter Cards complets dans `AcademyLayout`.

### Librairies UI/qualité (stack inspirée de TutorialsPoint, HORS pub)
> Décision : **pas de pub** (AdSense, Criteo, PubMatic… contredisent le modèle « gratuit + accompagnement »).
> On garde uniquement ce qui élève la qualité, via des librairies spécialisées.
- **Swiper** (`swiper`) : carrousels tactiles « Nos experts » et « Derniers articles » sur la home
  (`src/pages/academy/index.astro`), style à la charte dans `academy.css`. Auto-hébergé (pas de CDN).
- **CodeMirror 6** : éditeur des outils compilateur + code de pratique (coloration live, thème One Dark).
- **Iconify / Phosphor** (icônes duotone) + **Simple Icons** (réseaux) via `src/components/Ico.astro`.
- **Priority Hints** : `fetchpriority="high"` sur les images LCP (cover d'article, 1re carte liste articles).
- **Anti-spam — Cloudflare Turnstile** (`src/lib/turnstile.ts`) : widget sur **contact** et **inscription** ;
  vérif serveur dans `src/pages/api/auth/register.ts` et la nouvelle route `src/pages/api/contact.ts`
  (qui envoie via Brevo). En local, **clés de test** intégrées (marchent sans config). En prod :
  `PUBLIC_TURNSTILE_SITE_KEY` + `TURNSTILE_SECRET_KEY` (widget gratuit à créer sur Cloudflare).
  Le contact ne passe **plus** par Web3Forms.
- **Sentry** (`@sentry/astro`) : suivi d'erreurs JS (client + serverless). Intégration **conditionnelle**
  dans `astro.config.mjs` : active seulement si `SENTRY_DSN` est posé (sinon inerte). `tracesSampleRate 0.1`.

## À brancher (config back, différé)

### Paiement — agrégateur Mobile Money + carte
- Cible RDC : **FlexPay / MaxiCash / CinetPay** (couvrent Airtel/Orange/M-Pesa + carte) ou **Stripe**
  (carte). Front prêt (`/academy/compte/paiement/`). À faire : route API de checkout + **webhook**
  qui, au paiement confirmé, ouvre l'espace d'accompagnement (champ sur le User / enregistrement Redis).

### Exécution de code — moteur serveur
- **Judge0** (self-host ou API) pour Python/C/C++/Java dans le compilateur et la pratique.
  Aujourd'hui : JavaScript exécuté côté navigateur uniquement.

## Récap variables d'environnement
`ADMIN_SECRET`, `BREVO_API_KEY`, Redis (`KV_REST_API_URL/TOKEN` ou `REDIS_URL`), `GEMINI_API_KEY`,
`GITHUB_TOKEN`, `PEXELS_API_KEY`, `PIXABAY_API_KEY`, **`GOOGLE_CLIENT_ID`**, **`GOOGLE_CLIENT_SECRET`**,
**`PUBLIC_TURNSTILE_SITE_KEY`** + **`TURNSTILE_SECRET_KEY`** (anti-spam ; clés de test en repli local),
**`SENTRY_DSN`** (suivi d'erreurs ; inerte sans clé).
À venir : clés du fournisseur de paiement, endpoint/clé Judge0.
