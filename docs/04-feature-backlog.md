# 4 — Feature Backlog (Academy)

> Convention : `[x]` = livré. Deux états de livraison : **(local)** = fait, visible sur le serveur
> de dev, **pas encore déployé** ; **(en ligne)** = poussé sur Vercel.

## ✅ Fait — Socle Academy
- [x] Layout dédié `AcademyLayout` + design system `academy.css` (identité distinctive). (en ligne)
- [x] Accueil dense : hero, 4 cartes-domaines, catalogue par domaine, derniers articles. (en ligne)
- [x] Cours + lecteur de leçon (sommaire « chemin », prev/next, progression, quiz). (en ligne)
- [x] **Fiche PDF** réelle par leçon (pdfkit + marked, à la charte, polices embarquées). (en ligne)
- [x] Recherche globale, pages experts, **Articles dans la coquille Academy**. (en ligne)
- [x] **À propos** + **Contact** (Web3Forms) dans la coquille. (en ligne)

## ✅ Fait — Modules
- [x] **A. Comptes + progression** : inscription/connexion (e-mail+mdp & Google), vérif e-mail,
  mot de passe oublié, tableau de bord, bouton « terminé ». (en ligne)
- [x] **B → Accompagnement** : contenu libéré (gratuit) ; page `/academy/accompagnement/`
  (demande → inscription → paiement → espace), réservation, CTA sur pages expert. (en ligne)
- [x] **C. Outils** : tableau blanc, calculatrice graphique, compilateur (JS en direct),
  code de pratique (exos JS vérifiés). (en ligne)

## ✅ Fait — Clonage forme TutorialsPoint (local, non déployé)
- [x] 1. Barre utilitaire **à icônes**.
- [x] 2. Icônes **sociales colorées** (TikTok/YouTube/Facebook).
- [x] 3. **Hero riche** (collage 4 domaines).
- [x] 4. **Méga-menu « Domaines »** multi-colonnes.
- [x] 5. **Bibliothèque** `/academy/bibliotheque/` (catalogue par domaine, 58+ tutoriels).
- [x] 6. Désencombrement de la nav (retrait « Cours », en-tête resserré).

## ✅ Fait — Suite du clonage + refonte design (local, non déployé)
- [x] 7. **Parcours guidés** (cartes à étapes + skeleton « à venir »).
- [x] 9. **Détails page tuto** : code coloré + copier + exécuter + **3 pastilles**, **sommaire d'ancres**,
  figure de concept réutilisable (`.ac-figure`).
- [x] 10. **Passe mode sombre** complète (token `--ac-dark` pour la chrome constante).
- [x] **Type de marque = Montserrat** (police du logo) ; signature **swoosh** ; survols sobres.
- [x] **Icônes pro duotone** (Iconify/Phosphor + Simple Icons) via `Ico.astro`.
- [x] **CodeMirror 6** (compilateur + pratique) ; **Swiper** (carrousels experts/articles).
- [x] **Perf** (Speed Insights + fetchpriority LCP + Twitter Cards) ; **anti-spam Turnstile** ;
  **Sentry** (conditionnel).
- (8 « rangées de catégories » : abandonné — doublon avec Bibliothèque + Parcours ; catalogue home retiré.)

## 🟡 Fond — Le vrai enjeu (produit)
- [ ] **Remplir un domaine de bout en bout** avec son expert (le vrai test du modèle).
- [ ] Puis les 3 autres domaines. La forme est prête à recevoir la matière.

## 🔵 Back — Config finale (dernière étape, après la forme)
- [ ] Paiement réel **Mobile Money + carte** (agrégateur RDC : FlexPay/MaxiCash/CinetPay, ou Stripe)
  → webhook qui ouvre l'espace d'accompagnement.
- [ ] **Google OAuth** en prod : `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` + URI de redirection.
- [ ] **Compilateur multi-langages** côté serveur (type Judge0) pour Python/C/C++/Java.
- [ ] Protection serveur d'un éventuel contenu réservé (aujourd'hui tout est public).

## 🟢 Vision
- [ ] Certifications / attestations de parcours.
- [ ] Contenus en **langues locales RDC** (tête de pont).
- [ ] Application mobile / PWA.

> Écart central rappelé : **forme au niveau (voire au-dessus), fond à ~2%.** Ne pas confondre
> « squelette fini » et « produit fini ». La priorité rentable = matière + tunnel d'accompagnement.
