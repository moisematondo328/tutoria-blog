# 3 — Data Dictionary

> Deux sources de données : **contenu statique** (content collections Astro, `src/content/`) et
> **données dynamiques** (Redis/Upstash, via `src/lib/store.ts` et `src/lib/auth.ts`).

## A. Contenu statique — Content Collections (`src/content.config.ts`)

### `courses` (`src/content/courses/*.md`)
| Champ | Type | Notes |
|---|---|---|
| `title` | string | requis |
| `category` | string | un des 4 domaines (nom exact) |
| `expert` | string | nom de l'expert (lie à `EXPERTS`) |
| `cover` | string | image optionnelle |
| `excerpt` | string | résumé carte |
| `level` | string | défaut « Débutant » |
| `order` | number | tri |
| `draft` | boolean | exclu si true |

### `lessons` (`src/content/lessons/<course>/*.md`)
| Champ | Type | Notes |
|---|---|---|
| `title` | string | requis |
| `course` | string | id du cours parent |
| `order` | number | ordre dans le cours |
| `premium` | boolean | **hérité, non utilisé** (contenu gratuit ; plus de paywall) |
| `draft` | boolean | |
| `quiz` | array | `[{ q, options:[{ t, correct? }] }]` — rendu interactif + inclus au PDF |

Corps = markdown court : intro, **tableau**, **étapes numérotées** (`1. 2. 3.`), encadré
`> **À retenir.** …`. Pas de pavés.

### `blog` (`src/content/blog/*.md`) — les Articles
`title, date, category, excerpt, cover, draft`. ~57 articles migrés, classés dans les 4 domaines.
Servis dans la coquille Academy à `/academy/articles/[slug]/` et listés dans la Bibliothèque.

### `books`, `videos`
Collections héritées du blog (livres, vidéos). Présentes, peu utilisées côté Academy.

## B. Constantes (`src/consts.ts`)
- `PILLARS` : `{ name, slug, color, icon, blurb }` × 4.
- `EXPERTS` : `{ name, slug, pillar (nom du domaine), role, bio }` × 6. Helpers `expertBySlug`,
  `expertByName`.
- `SITE`, `SOCIALS`, `NAV`, `pillarByName`, `catSlugOf`, `readingTime`.

## C. Offres (`src/lib/plans.ts`)
- `ACCOMP` : le produit payant. `{ name, tagline, blurb, cta, steps[3], formats[] }`.
  `formats` = `[{ id:'seance', price:15, per:'la séance' }, { id:'mensuel', price:49, per:'par mois', highlight }]`.
- `PAY_METHODS` : `[{ id, label, kind:'mobile'|'card', hint }]` — Airtel, Orange, M-Pesa,
  Africell, Carte.
- (`PLANS`/`COACHING`/`getPlan` : reliquats de l'ancienne offre Premium, non utilisés.)

## D. Données dynamiques — Redis (`src/lib/auth.ts`, `store.ts`)

### Modèle `User` (clé `user:{id}`)
| Champ | Type | Notes |
|---|---|---|
| `id` | string | `randomBytes(9).base64url` |
| `email` | string | normalisé (minuscule) |
| `name` | string | |
| `passwordHash` | string \| null | `scrypt$sel$clé` ; null si Google seul |
| `provider` | 'email' \| 'google' | |
| `verified` | boolean | e-mail confirmé |
| `avatar` | string? | photo Google |
| `plan` | 'free' \| 'premium' | **hérité** (contenu gratuit ; réservé à un usage futur) |
| `planUntil` | number? | échéance éventuelle |
| `createdAt` | number | timestamp |

`SafeUser` = `User` sans `passwordHash` (renvoyé par l'API `/api/auth/me`).

### Clés Redis
| Clé | Valeur | TTL |
|---|---|---|
| `user:{id}` | objet User | ∞ |
| `user:byEmail:{email}` | `{ id }` | ∞ |
| `session:{token}` | `{ userId, createdAt }` | 30 j |
| `verify:{token}` | `{ userId }` | 24 h |
| `reset:{token}` | `{ userId }` | 1 h |
| `user:{id}:progress` | `{ "courseId/lessonSlug": timestamp }` | ∞ |

Cookies : `tuto_session` (httpOnly, Secure, SameSite=Lax, 30 j) ; `oauth_state` (10 min, CSRF Google).

## E. Progression
`Progress = Record<"courseId/lessonSlug", timestamp>`. API `/api/progress` (GET état, POST bascule).
Le lecteur (bouton « Marquer comme terminé ») et le tableau de bord lisent/écrivent cette clé.
