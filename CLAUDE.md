# CLAUDE.md — Tutoria News (site blog)

Instructions pour Claude Code / tout développeur reprenant ce projet.

## Ce que c'est
Blog éducatif **Tutoria News** (média francophone, Afrique). Site **statique Astro**, reconstruit
depuis un backup WordPress, déployé sur **Vercel**. Voir `docs/01-app-spec.md`.

## Stack
- **Astro 5** (statique / SSG par défaut), TypeScript léger.
- **Fonctions serveur** via l'adaptateur `@astrojs/vercel` : les routes `src/pages/api/*`
  et `admin` portent `export const prerender = false` (le reste du site reste statique).
- Contenu = **Markdown** dans `src/content/blog/` (content collections, `src/content.config.ts`).
- Images = **WebP** dans `public/uploads/AAAA/MM/`.
- Déploiement = **Vercel** (auto-deploy à chaque push sur `main`).

## Commandes
```bash
npm install
npm run dev       # serveur local http://localhost:4321
npm run build     # build de prod -> dist/
npm run preview   # prévisualiser le build
```

## Structure
- `src/pages/` — routes : `index`, `articles`, `livres`, `contact`, `a-propos`, `404`,
  `blog/[slug]`, `categorie/[slug]`, `rss.xml` (flux RSS), `admin` (back-office privé),
  `moderation` (redirige vers `/admin`).
- `src/pages/api/` — fonctions serveur : `subscribe` (newsletter Brevo + mail de bienvenue),
  `comments` + `moderate` (commentaires maison), `broadcast` + `cron-broadcast` (diffusion
  des articles aux abonnés), `generate` (rédaction IA Gemini), `publish` (crée l'article via GitHub).
- `src/lib/` — `store.ts` (Redis, agnostique au préfixe), `brevo.ts` (clé + campagnes + gabarit e-mail).
- `src/components/` — Header, Footer, HeroSlider, PostCard, Sidebar, Newsletter, Comments, Icon.
- `src/layouts/BaseLayout.astro` — <head> (SEO, GA4, Search Console), header/footer, et le
  **script global** (`astro:page-load`) qui pilote : horloge, rotateur, menu, mode sombre,
  slider, révélations au scroll, formulaires Web3Forms, Giscus, page_view GA4.
- `src/consts.ts` — SITE, SOCIALS, NAV, PILLARS, helpers (`pillarByName`, `catSlugOf`, `readingTime`).
- `src/styles/global.css` — tout le design (voir `docs/02-brand-brief.md`).
- `scripts/gen-content.mjs` — génère les .md depuis un `posts.json` (extraction WordPress).

## Conventions articles (frontmatter)
```yaml
title: "…"            # requis
date: "AAAA-MM-JJ HH:mm:ss"
category: "Santé & Bien-être" | "Développement Personnel" | "Finance & Investissement" | "Technologie Émergente"
excerpt: "…"          # résumé SEO / cartes
cover: "/uploads/AAAA/MM/fichier.webp"
draft: false          # true = non publié (modération)
```
Le `categorySlug` est **déduit** du `category` par `catSlugOf()` — pas besoin de le saisir.
Les articles `draft: true` sont exclus partout (filtre `({data}) => !data.draft`).

## Déploiement & contrainte connexion
- Push sur `main` → Vercel build + déploie automatiquement.
- ⚠️ **Connexion du fondateur lente/instable** : un gros push échoue (HTTP 408). Pousser en
  **micro-paquets ~900 Ko** (voir `docs/06-error-log.md`). Images toujours en WebP compressé.

## Back-office `/admin` (privé, `noindex`) — le cœur de l'automatisation
Un seul mot de passe (`ADMIN_SECRET`). Trois onglets :
- **Créer** : sujet → l'IA **Gemini** rédige un article découpé en sections (voix Tutoria,
  anti-AI-slop) → relecture/édition → **Publier** : pour CHAQUE section, une **carte-image à
  la charte** est fabriquée (photo **Pexels** + voile teal + kicker jaune « ÉTAPE X » + titre
  blanc + barre jaune, via `sharp` + police Poppins embarquée, cf. `src/lib/card.ts`) puis
  insérée après son titre ; l'article `.md` + toutes ses images partent en **un seul commit**
  GitHub (`/api/publish`, Git Data API) → Vercel déploie. Sans `PEXELS_API_KEY`, repli en
  texte seul (aucune image, pas d'erreur).
- **Diffusion** : envoie un article aux abonnés (campagne Brevo) ; interrupteur **auto**
  (cron quotidien `vercel.json` → `/api/cron-broadcast`, n'envoie que les articles publiés
  APRÈS activation) ; recherche + pagination.
- **Modération** : commentaires en attente (approuver / supprimer).

## Intégrations
- **Contact** : Web3Forms (formulaire de la page contact).
- **Newsletter** : Brevo (liste #3) via `/api/subscribe` + **e-mail de bienvenue** transactionnel
  (expéditeur vérifié `tutorianews@gmail.com`). Popup d'incitation.
- **Commentaires** : système **maison** (fini Giscus) — stockage **Upstash/Vercel KV** (Redis),
  sans compte visiteur, pré-modérés.
- **Diffusion** : campagnes Brevo + flux **RSS** (`/rss.xml`).
- **Contenu** : Pages CMS (`.pages.yml`) OU l'onglet **Créer** de `/admin` (IA).
- **Analytics/SEO** : GA4 + Vercel, Search Console + sitemap. Détail : `docs/05-integrations.md`.

## Variables d'environnement (Vercel → Settings → Environment Variables)
- `ADMIN_SECRET` — mot de passe du back-office `/admin`.
- `BREVO_API_KEY` — newsletter + mails (format `xkeysib-…`, retrouvée aussi par format).
- Base **Redis/Upstash** connectée (préfixe `KV`) → `KV_REST_API_URL/TOKEN` (ou `REDIS_URL`).
- `GEMINI_API_KEY` — rédaction IA (format `AIza…`).
- `GITHUB_TOKEN` — publication d'articles (droit *contents* sur `moisematondo328/tutoria-blog`) ;
  `GITHUB_REPO` optionnel pour changer de dépôt.
- `PEXELS_API_KEY` — banque photo pour les cartes-images des articles générés. Absente = articles
  publiés en texte seul (repli propre).

## Docs de référence
`docs/01-app-spec.md` · `02-brand-brief.md` · `03-data-dictionary.md` · `04-feature-backlog.md`
· `05-integrations.md` · `06-error-log.md`.
