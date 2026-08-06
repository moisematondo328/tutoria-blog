# Audit rigoureux du site Tutoria News — fond, forme, fonctionnement

*Réalisé le 06/08/2026, avec test automatisé de tous les liens/images + revue critique.*

## ✅ Santé structurelle (excellente)
- **66 pages** générées, **3745 liens internes testés → 0 cassé**, **1532 images testées → 0 cassée**.
- Routing complet : accueil, 56 articles, 4 catégories, articles, livres, contact, à-propos, 404.
- **Sitemap** ✔, **robots.txt** ✔, responsive ✔, mode sombre ✔, animations ✔.
- SEO de base : titres uniques, meta-description, og:image (couverture), canonical.

## 🔧 Corrigé pendant l'audit
1. **56 liens morts** vers l'ancien domaine `tutorianews.net` → réécrits vers `/blog/…`, `/categorie/…`, `/livres/`.
2. **Liens externes** → ouvrent désormais dans un nouvel onglet, sécurisés (`noopener noreferrer nofollow`).
3. **Page 404** personnalisée (branding + rubriques).
4. **robots.txt** ajouté (avec sitemap).
5. **Cloche emoji** → icône maison (cohérence du jeu d'icônes).

## ⚠️ Punch-list — décisions & branchements (surtout au déploiement)
| # | Point | Gravité | Action |
|---|---|---|---|
| 1 | **Formulaires non branchés** (newsletter, contact) — visuels seulement | 🟠 | Relier à Formspree / MailerLite au déploiement |
| 2 | **« 0 commentaire » partout** — pas de vrai système | 🟠 | Brancher **Giscus** (commentaires + modération via GitHub) OU masquer |
| 3 | **Page Livres = données factices** + boutons décoratifs | 🟠 | Mettre de vrais livres/PDF, ou masquer la page tant que vide |
| 4 | **Vrais liens réseaux sociaux** à confirmer (FB/TikTok/YT) | 🟡 | Me donner tes URLs exactes |
| 5 | **Images lourdes** (PNG WordPress, certaines > 1 Mo) | 🟡 | Conversion WebP / optimisation (perf) |
| 6 | **Données structurées Schema.org (Article)** absentes | 🟡 | À ajouter (SEO Google) |
| 7 | **4 liens `#`** inertes (article Facebook) | 🟢 | Bénin (anciennes ancres WP) |
| 8 | **Redondance « ACTU »** (masthead + ticker) et rotateur/ticker | 🟢 | Fidèle à la maquette — à surveiller |
| 9 | **Recherche = filtre par titre** (client) | 🟢 | Recherche plein-texte (Pagefind) plus tard |

## Verdict
Le site est **structurellement sain et prêt à déployer**. Les points restants sont soit des
**branchements de déploiement** (formulaires, commentaires, vrais liens), soit des **améliorations
progressives** (perf, Schema, recherche) — aucun n'est bloquant.
