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

## Conventions
- Ajouter une ligne à **chaque** erreur non triviale : date, problème, cause, solution.
- Si un problème revient, vérifier d'abord ce journal.
