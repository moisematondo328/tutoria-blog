# 2 — Brand Brief (Univers de marque · Academy)

> Système de design **Tutoria Academy** : distinctif, non générique, non « AI slop ».
> Source de vérité : `src/styles/academy.css` (tokens `--ac-*`). Le layout : `src/layouts/AcademyLayout.astro`.

## Positionnement
Une **école en ligne francophone pour l'Afrique** : sérieuse mais accessible, concrète, chaleureuse.
On n'est pas un blog magazine, on n'est pas une doc froide. On **guide** (Tuto + Orientation).

## Couleurs (tokens `--ac-*`)
| Rôle | Token | Hex |
|---|---|---|
| Fond papier-menthe | `--ac-paper` | `#F2F6F3` |
| Surface (cartes) | `--ac-surface` | `#FFFFFF` |
| Encre (texte fort) | `--ac-ink` | `#0A2621` |
| Encre douce | `--ac-ink-soft` | `#3D554F` |
| Gris texte | `--ac-muted` | `#6A817B` |
| **Teal (primaire)** | `--ac-teal` | `#0E8074` |
| Teal foncé | `--ac-teal-d` | `#0B5F56` |
| Teal clair | `--ac-teal-l` | `#17B39D` |
| **Jaune (accent)** | `--ac-yellow` | `#FDD200` |
| Jaune foncé | `--ac-yellow-d` | `#E0A400` |
| Lignes | `--ac-line` | `#DBE7E2` |

**Accents par domaine :** Santé `#0E8074` · Dév perso `#E0A400` · Finance `#0B6E64` · Tech `#17B39D`.
**Mode sombre** : redéfinition des mêmes tokens sous `:root[data-theme="dark"]` (fond `#08110F`,
surface `#0F1B18`, encre `#EAF3EF`). Toute nouvelle couleur DOIT passer par un token, jamais en dur.

## Typographie
- **Police de marque : Montserrat** (`--ac-display` ET `--ac-body`) — **c'est la police officielle du
  logo Tutoria.** Affichage en 800/900 (titres, chiffres), corps en 400/500. Interlettrage négatif
  léger sur les grands titres.
- **Mono** (code) : `ui-monospace, Menlo, Consolas`.
- Chargée via Google Fonts dans `<head>` de `AcademyLayout`.
- **PDF** : Montserrat aussi (TTF embarqués `src/assets/pdf-fonts/Montserrat-*.ttf` pour pdfkit) →
  identité 100% cohérente site ↔ fiche PDF.

## Ton éditorial (copywriting)
- **Tutoiement**, direct, verbes d'action. « Tu lis, tu comprends, tu appliques. »
- Phrases courtes. Zéro blabla, zéro jargon inutile. Chaque mot aide à agir.
- Exemples **locaux** (contexte RDC/Afrique : francs, Mobile Money, quotidien).
- **INTERDIT : les tirets cadratins (— / –).** Utiliser deux-points, points, ou « · ».
- Les erreurs ne s'excusent pas et ne sont jamais vagues : elles disent quoi faire.

## Signatures (les détails qui « disent quelque chose »)
0. **Le swoosh** (`.ac-hl`) : surligneur jaune légèrement incliné sous un mot-clé, **écho du trait du
   logo**. LA touche signature (ex. « Applique. » du hero). Variante douce `.ac-em-mark`.
1. **Le chemin d'apprentissage** : fil pointillé à nœuds. Dans le hero, les 3 nœuds sont nommés
   **Apprends → Comprends → Applique** (la méthode racontée en un coup d'œil). Repris dans le
   lecteur (sommaire `AcademyTree`, jalons losange) et sur la page Accompagnement (chemin *Toi → Expert*).
2. **Hero collage** : chaque vignette dit un domaine avec du vrai contenu (budget 50/30/20 = Finance,
   fenêtre de code = Tech, pouls = Santé, régularité en série = Dév perso).
3. **Étapes numérotées** en pastilles teal, **encadré « À retenir »** jaune, **quiz** à pastilles.
4. **Pastille jaune** pour les accents (niveau, « le plus choisi », Premium historique).

## Composants clés (classes)
`.ac-util` (barre + icônes), `.ac-mega` (méga-menu), `.ac-hero2` + `.ac-h-illu` (hero collage),
`.ac-feat` (cartes-domaines dégradées), `.ac-card` (cours), `.ac-reader` + `AcademyTree` (lecteur),
`.ac-quiz`, `.ac-lib-*` (bibliothèque), `.ac-auth-*` (formulaires), `.ac-btn` (boutons),
`.ac-tbtn` / `.ac-code-*` (outils), `.ac-foot-cols` (pied multi-colonnes).

## Règles de qualité (plancher)
- Responsive jusqu'au mobile (en-tête compact + tiroir `.ac-mobile` < 860px ; `body{overflow-x:hidden}`).
- Icônes = **jeu duotone** centralisé (`src/lib/icons.ts`) : trait principal `currentColor` + accent
  `var(--ac-ic-accent)` (jaune de marque, réglé par contexte). Jamais d'emoji comme icône d'UI.
- Survols : boutons qui décollent + ombre teintée ; nav soulignée à l'animation ; `:focus-visible`
  visible ; `prefers-reduced-motion` respecté.
- Focus clavier visible, `prefers-reduced-motion` respecté.
- Mesure de lecture confortable (max ~72ch dans les lecteurs).
- Le CSS scopé Astro **ne s'applique pas au DOM injecté en JS** → styles globaux dans `academy.css`.
