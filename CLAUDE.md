# CLAUDE.md — Tutoria News (site blog)

Instructions pour Claude Code / tout développeur reprenant ce projet.

## Ce que c'est
Blog éducatif **Tutoria News** (média francophone, Afrique). Site **statique Astro**, reconstruit
depuis un backup WordPress, déployé sur **Vercel**. Voir `docs/01-app-spec.md`.

## Stack
- **Astro 5** (statique / SSG), TypeScript léger.
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
  `blog/[slug]`, `categorie/[slug]`.
- `src/components/` — Header, Footer, HeroSlider, PostCard, Sidebar, Newsletter, Giscus, Icon.
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

## Intégrations
Formulaires (Web3Forms), commentaires (Giscus), back-office (Pages CMS `.pages.yml`), analytics
(GA4 + Vercel), SEO (Search Console + sitemap). Détail : `docs/05-integrations.md`.

## Docs de référence
`docs/01-app-spec.md` · `02-brand-brief.md` · `03-data-dictionary.md` · `04-feature-backlog.md`
· `05-integrations.md` · `06-error-log.md`.
