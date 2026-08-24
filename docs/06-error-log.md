# 6 — Journal d'erreurs (Error Log)

Historique des problèmes rencontrés et leurs solutions — pour ne pas les revivre.

| Date | Problème | Cause | Solution |
|---|---|---|---|
| 07/08 | **`git push` échoue (HTTP 408)** sur gros envoi | Connexion lente/instable ne tient pas un pack > ~1 Mo | Compresser images en WebP (56→11 Mo) + **pousser en micro-paquets ~900 Ko** (script `push-chunks`) |
| 07/08 | **Docker daemon absent** (extraction backup) | Docker Desktop non démarré | Parser le dump SQL directement en **Node** (aucune base à lancer) |
| 06/08 | **Gemini erreur 503** « forte demande » | Modèle surchargé (palier gratuit) | Réessayer, ou **changer de modèle** (gemini-2.5-flash) ; + gestionnaire d'erreurs Make |
| 07/08 | Search Console **« Impossible de trouver le fichier de validation »** | Méthode « Fichier HTML » choisie alors que la **balise meta** était posée | Utiliser la méthode **« Balise HTML »** (le meta est déjà dans `<head>`) |
| 07/08 | Sitemap **« Impossible de récupérer »** | Statut temporaire sur site neuf (Google pas encore repassé) | **Normal** — Google réessaie seul sous quelques heures/jours ; ne pas re-soumettre en boucle |
| 06/08 | **Liens morts** vers `tutorianews.net` dans les articles | Anciens permaliens WordPress (domaine hors ligne) | Réécriture auto → `/blog/…`, `/categorie/…`, `/livres/` (dans `gen-content.mjs`) |
| 06/08 | `rehype-external-links` **sans effet** | Ne traite pas le HTML brut des articles WordPress | Ajout `target/rel` par **regex à la génération** (`secureExternalLinks`) |
| 07/08 | **Canonical/sitemap** pointaient vers `tutorianews.net` | `site` mal configuré (domaine perdu) | `astro.config` → `site: https://tutoria-blog.vercel.app` |
| 23/08 | **Styles Astro scopés sans effet** sur du DOM injecté en JS | Le CSS scopé cible le HTML rendu au build, pas les nœuds créés en JS | Mettre ces styles en **global** dans `academy.css` (résultats de recherche, etc.) |
| 23/08 | `slugOf is not defined` dans `getStaticPaths` | `getStaticPaths` s'exécute dans un scope isolé | Définir les helpers **à l'intérieur** de `getStaticPaths` (et à part dans le composant) |
| 23/08 | **Police PDF introuvable au build** (`ENOENT …/dist/server/…/pdf-fonts`) | `import.meta.url` réécrit par le bundler vers `dist/` | Charger les TTF via **`process.cwd()`** (`src/assets/pdf-fonts`), présent au build statique |
| 23/08 | **Bricolage variable** rendue en Regular par pdfkit | pdfkit/fontkit prend l'instance par défaut d'une police variable | **Instancier une TTF statique Bold** (`fonttools instancer wght=700`) et l'embarquer |
| 23/08 | **Glyphe manquant** (✓) dans le PDF (tofu) | Poppins ne contient pas ✓ | **Dessiner** la coche en vecteur (traits) au lieu d'un caractère |
| 23/08 | **`EPERM` en supprimant `dist/`** au build | Un shell avait son `cwd` dans `dist/…` (verrou Windows) | Sortir le `cwd` de `dist/`, `rm -rf dist` puis rebuild |
| 23/08 | **Débordement horizontal mobile** (contenu coupé, titres tronqués) | En-tête non responsive : nav + recherche + actions forçaient la largeur du `body` | En-tête compact < 860px (cacher nav/recherche/actions, **tiroir `.ac-mobile`**), `body{overflow-x:hidden}`, mesure via page-sonde |
| 23/08 | **Liens vers l'ancien magazine** (À propos, Contact) | Ils pointaient vers les pages `BaseLayout` (blog) | Recréer ces pages **dans la coquille Academy** (`/academy/a-propos`, `/academy/contact`) et repointer |
| 24/08 | **Icônes emoji = « AI slop »** dans les outils/hub | Emoji comme icône d'UI (rendu incohérent) | Remplacer par un jeu **SVG trait fin** cohérent (currentColor) |
| 24/08 | **Nav qui déborde à ~1280px** (« Se connecter » à la ligne) | Trop d'items + recherche large + gros gaps | Retirer « Cours », resserrer gaps/padding, `white-space:nowrap` sur `.ac-acct`, recherche 340px |
| 24/08 | **Serveur de dev qui s'arrête** entre les sessions | Tâche background tuée à la fermeture du process précédent | Le **relancer** (`npm run dev -- --host --port 4321`) ; Astro met ~30 s à chaud |

## Conventions
- Ajouter une ligne à **chaque** erreur non triviale : date, problème, cause, solution.
- Si un problème revient, vérifier d'abord ce journal.
