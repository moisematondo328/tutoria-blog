# 3 — Data Dictionary (Dictionnaire des données)

## Collection `blog` (articles) — `src/content/blog/*.md`
Définie dans `src/content.config.ts` (schéma Zod).

| Champ | Type | Requis | Description |
|---|---|---|---|
| `title` | string | ✅ | Titre de l'article |
| `date` | datetime | ✅ | Date de publication (`AAAA-MM-JJ HH:mm:ss`) |
| `category` | enum (4 piliers) | ✅ | Rubrique — voir liste ci-dessous |
| `categorySlug` | string | ⬜ (déduit) | Slug de rubrique ; sinon calculé via `catSlugOf()` |
| `excerpt` | string | ⬜ | Résumé (SEO + cartes). Auto-généré si vide |
| `cover` | string (chemin) | ⬜ | Image à la une : `/uploads/AAAA/MM/*.webp` |
| `draft` | boolean | ⬜ (défaut false) | `true` = non publié (modération) |
| *body* | markdown/HTML | — | Corps de l'article (après le frontmatter) |

`id` d'un article = nom du fichier sans `.md` = son slug d'URL (`/blog/<id>/`).

## Rubriques (piliers) — `src/consts.ts`
| Nom (`category`) | `slug` (URL) | Couleur | Icône |
|---|---|---|---|
| Santé & Bien-être | `sante-bien-etre` | `#0E8074` | health |
| Développement Personnel | `developpement-personnel` | `#E0A400` | growth |
| Finance & Investissement | `finance-investissement` | `#0B6E64` | finance |
| Technologie Émergente | `technologie-emergente` | `#12A594` | tech |

## Médias
- Emplacement : `public/uploads/AAAA/MM/`
- Format : **WebP** (converti/compressé, largeur max 1000 px, qualité ~58).
- Référence dans le contenu : `/uploads/AAAA/MM/fichier.webp`.

## Données côté « usine à contenu » (séparé — Airtable)
La base Airtable **« Tutoria — Usine à contenu »** (table `Contenus`) alimente la production
vidéo/sociale. Champs : Sujet, Angle, Pilier, Statut, Hook, Script, Textes_ecran, A_filmer, Titre,
Description, Hashtags, Voix_URL, Video_URL, perf… (voir `00_Pilotage/Kit-Automatisation/`).
> À terme, cette base pourra **générer des articles** poussés vers `src/content/blog/` (auto-publication).
