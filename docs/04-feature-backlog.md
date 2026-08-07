# 4 — Feature Backlog

## ✅ Fait (v1 en ligne)
- Migration des **56 articles** + images depuis le backup WordPress.
- Design **magazine fidèle** (teal/jaune) : en-tête 3 étages, ticker ACTU, sidebar.
- **Slider** d'articles à la une, **mode sombre**, **responsive**, transitions de page.
- Icônes maison, animations au scroll, micro-interactions.
- Pages : accueil, article (+ commentaires), rubrique, articles (+ filtre), livres, contact, à-propos, 404.
- **SEO** : sitemap, robots.txt, données structurées Article, méta, Search Console.
- **Formulaires** contact + newsletter (Web3Forms).
- **Commentaires** Giscus (modérables via GitHub).
- **Back-office** Pages CMS (créer/éditer/supprimer, brouillon/publié).
- **Analytics** : Google Analytics 4 + Vercel Analytics + Speed Insights.
- Optimisation images WebP (56 Mo → 11 Mo).

## 🟠 Prioritaire (prochain)
- [ ] **Récupérer le domaine `tutorianews.net`** (SEO marque) — sinon rester en vercel.app.
- [ ] **Newsletter → vrai service de liste** (MailerLite/Buttondown) au lieu d'e-mails Web3Forms.
- [ ] **Recherche plein-texte** (Pagefind) au lieu du filtre par titre.
- [ ] **Vrais livres/PDF** sur la page Livres (aujourd'hui : exemples).
- [ ] **Compteur de commentaires** réel sur les cartes (au lieu de « 0 »).

## 🟡 Moyen terme
- [ ] **Auto-publication** : pipeline IA (Airtable → article `.md` → commit → deploy).
- [ ] Optimisation perf avancée (images responsives, lazy, cache).
- [ ] Page « Podcast » (intégrer les épisodes existants).
- [ ] Newsletter automatique (résumé hebdo des nouveaux articles).

## 🟢 Vision (long terme)
- [ ] Contenus en **langues locales RDC** (tête de pont — voir Roadmap `00_Pilotage/`).
- [ ] Application mobile / PWA.
- [ ] Espace membres / cours (Tutoria Academy).

> Convention : cocher `[x]` quand livré, dater la ligne, et déplacer vers « Fait ».
