# 7 — Benchmark design : TutorialsPoint (audit critique)

> Analyse rigoureuse du design de tutorialspoint.com (home, bibliothèque, page tuto, outils),
> avec un sens critique : ce qu'on **adopte**, ce qu'on **évite**, et là où **on les dépasse déjà**.
> But : caler notre forme sans copier leurs défauts.

## 1. Palette & cohérence couleur
- **Primaire** : un **vert** unique (~`#2A9D4A`, vert « brand »). Utilisé pour titres, nœuds, boutons,
  liens actifs. Chrome sombre (barre + footer) ~`#1B1B1B`.
- **Fond hero** : dégradé **vert menthe très clair** (~`#EEF9F0`), quasi blanc.
- **⚠️ Faiblesse** : sur la home, le carrousel de cours utilise **des accents multicolores**
  (bleu, orange, violet, teal) par techno → la page perd en cohérence, ça fait « catalogue » plus
  que « marque ». **Nous, on garde la discipline 2 couleurs (teal + jaune)** = plus premium.

## 2. Rythme des fonds (BG par section)
- Séquence réelle : **blanc → blanc → blanc → gris très clair → footer sombre**.
- **⚠️ Faiblesse : monotonie.** Presque tout est blanc ; le seul contraste est le footer. Peu de
  respiration entre sections.
- **On les dépasse** : alternance `paper` (#F2F6F3) / `surface` (#FFF) + **bandeaux encre** (accompagnement,
  CTA) + mode sombre complet → rythme plus lisible.

## 3. Cartes & contours
- **Rayon** 8-12px, **bordures hairline** (1px, très claires), **ombres subtiles**. Cohérent partout.
- Détail signature : **fenêtre de code façon macOS** (bandeau + 3 pastilles rouge/jaune/vert).
- **⚠️ Faiblesse** : ombres si discrètes que certaines cartes paraissent plates sur fond blanc.
- **Nous** : mêmes rayons/hairline (tokens `--ac-line`, `--ac-radius`), + accent **bord gauche coloré**
  par domaine (`.ac-card`, `.ac-path-card`) que TP n'a pas. **À adopter** : les 3 pastilles de fenêtre
  de code sur nos blocs `.ac-codewrap` (petit plus pro).

## 4. Icônes
- **Barre utilitaire** : icônes **ligne monochrome** cohérentes (déjà cloné).
- **Cartes techno** : **devicon** (vrais logos colorés Python/Java/…) → très pro, reconnaissable.
- **Sociales** : icônes de marque colorées (déjà cloné).
- **On adapte** : pas de « logos » pour nos domaines de vie → on a nos **métaphores SVG** (cœur, courbe,
  code, série). Choix correct : leur devicon marche parce qu'ils vendent des technos.

## 5. Hero (leur meilleur atout)
- Collage de **diagrammes de concepts vivants** : arbre binaire, tableau à deux pointeurs, fenêtre de
  code, graphe + puces de langages + pictos estompés + filigrane « tp ». Chaque élément = un concept
  qu'on apprendra. Dense **mais purposeful**.
- **Déjà cloné** (adapté à nos 4 domaines : budget 50/30/20, code, pouls, régularité).
- **À creuser** : pour le domaine Tech, on peut ajouter des **mini-diagrammes de concept** dans les
  leçons (comme leur arbre/graphe) plutôt que du texte seul.

## 6. Typographie
- **Display** : sans rondouillard gras (vert). **Corps** : sans neutre système.
- **⚠️ Faiblesse** : type sympathique mais **générique**.
- **On les dépasse** : **Bricolage Grotesque + Poppins** = plus caractériel et distinctif.

## 7. Composants & architecture système (templates de page)
Système clair et **répétable**, à 4 gabarits :
1. **Home marketing** : empilement de sections (carrousel, features, catalogue, outils, footer).
2. **Bibliothèque / catalogue** : listes de liens denses multi-colonnes + compteurs (SEO).
3. **Lecteur de tuto** : **3 colonnes** = sommaire gauche profond / contenu / **pub droite**. Anchors
   in-page, **code exécutable**, prev/next, print.
4. **Outils** (compilateur, tableau blanc, calculatrice) : **apps plein cadre**, éditeur sombre + panneau
   sortie, barre d'actions (Run, langage, thème, partage).
- **En-tête à 2 étages** : barre utilitaire (outils + sociales + thème) puis nav (logo + méga-menu
  « Catégories » + Tutoriels/Cours/Emplois + bouton Connexion vert).
- **Nous** : on a 1/2/4 et l'en-tête 2 étages. Notre lecteur = **2 colonnes (sommaire + contenu), sans
  pub** (modèle accompagnement). **À faire éventuellement** : sommaire gauche plus profond quand un cours
  aura beaucoup de leçons.

## 8. Fenêtres de dialogue / windows
- Motif récurrent = **fenêtre de code macOS** (3 pastilles). Modales standard (connexion, partage) peu
  travaillées. **À adopter** : le motif 3 pastilles ; pas grand-chose d'autre à prendre.

## 9. Contenu PDF / eBooks
- Ils **monétisent** les tutoriels en **PDF/eBooks** (boutique). PDF = contenu du tuto compilé, mise en
  page **utilitaire** (pas très soignée).
- **On les dépasse déjà** : notre **fiche PDF par leçon est à la charte, gratuite, embellie** (pdfkit,
  polices embarquées, bandeau, quiz). C'est un différenciateur.

## Verdict — plan d'action
**À adopter — FAIT (local, non déployé) :**
- [x] Motif **3 pastilles** sur les blocs de code (`.ac-codewrap`).
- [x] Mini-**diagrammes de concept** dans les leçons (motif réutilisable `.ac-figure` + SVG inline en
  markdown ; ex. « une variable = un nom qui pointe vers une valeur »).
- [x] Sommaire gauche **plus profond** : sous la leçon active, ses sections en **sous-ancres**
  (`AcademyTree` prop `activeHeadings`).

**À éviter (leurs faiblesses) :**
- Multicolore incohérent · fonds tout-blancs monotones · pub dans le lecteur · densité écrasante
  (73 catégories brutes) · typo générique.

**Là où on gagne déjà :** discipline 2 couleurs · rythme de fonds + mode sombre · bord gauche coloré ·
signature « chemin » · fiche PDF soignée · Bricolage/Poppins.
