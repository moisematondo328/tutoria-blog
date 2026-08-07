# 5 — Intégrations

> ⚠️ Les clés ci-dessous sont **côté client (publiques)** — normal pour ces services. Les vraies
> **clés secrètes** (API Gemini/ElevenLabs de l'usine à contenu) ne sont **PAS** dans ce dépôt :
> elles vivent dans le compte **Make** du fondateur.

| Service | Rôle | Config / identifiant | Où |
|---|---|---|---|
| **GitHub** | Dépôt du code | `github.com/moisematondo328/tutoria-blog` (public, branche `main`) | — |
| **Vercel** | Hébergement + auto-deploy | Projet `tutoria-blog` → `https://tutoria-blog.vercel.app` | Dashboard Vercel |
| **Web3Forms** | Formulaires contact + newsletter | access key `bdb279ee-…257ba0` | `contact.astro`, `Newsletter.astro` |
| **Giscus** | Commentaires (GitHub Discussions) | repo-id `R_kgDOTwRb-A`, category `Announcements` (`DIC_kwDOTwRb-M4DC20Z`) | `Giscus.astro` + `BaseLayout` |
| **Pages CMS** | Back-office / éditeur d'articles | config `.pages.yml` — app sur `app.pagescms.org` | racine du dépôt |
| **Google Analytics 4** | Audience | ID de mesure `G-C4VSWCY4HC` | `BaseLayout.astro` (head) |
| **Google Search Console** | Indexation / SEO | vérifié par balise meta ; sitemap `/sitemap-index.xml` | `BaseLayout.astro` (meta) |
| **Vercel Analytics + Speed Insights** | Trafic + Web Vitals | `@vercel/analytics`, `@vercel/speed-insights` | `BaseLayout.astro` |

## Chaîne de déploiement
`git push origin main` → GitHub → **Vercel build (`astro build`)** → mise en ligne automatique.
(Le back-office Pages CMS commit aussi sur `main` → même chaîne.)

## Écosystème « usine à contenu » (dépôt séparé, hors site)
Make (orchestrateur) + **Google Gemini** (cerveau, gratuit) + **Airtable** (base) + **ElevenLabs**
(voix) + **CapCut Pro / Edimakor** (montage). Détail : `00_Pilotage/Kit-Automatisation/`.
