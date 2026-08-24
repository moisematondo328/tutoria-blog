# 1 — App Spec (Cahier des charges)

> Mis à jour : refonte **Tutoria Academy** (plateforme d'apprentissage, clone rigoureux de
> tutorialspoint.com adapté à nos 4 domaines). L'ancien blog reste dans le projet comme
> section « Articles », il n'est plus l'expérience principale.

## C'est quoi ?
**Tutoria Academy** est une **plateforme d'apprentissage francophone**, pensée pour l'Afrique.
On y trouve des **parcours structurés** (cours → leçons courtes), une **bibliothèque** de tutoriels
classés par domaine, des **outils interactifs** (compilateur, tableau blanc, calculatrice, pratique),
et un **accompagnement** payant par des experts.

> Le nom : **Tutoria = Tutoriel + Orientation.** L'ADN = *guider pas à pas, ne jamais laisser
> l'apprenant se perdre.* La signature visuelle (le « chemin d'apprentissage ») incarne cette idée.

## C'est pour qui ?
- **Cœur de cible** : jeunes francophones **16-35 ans**, Afrique (RDC et diaspora), qui veulent
  apprendre du concret et l'appliquer vite. « En Afrique, les gens ne lisent pas des pavés » →
  contenu court, structuré, visuel.
- **Secondaire** : toute personne cherchant à progresser sur l'un des 4 domaines.
- **B2B / institutionnel** : écoles, ONG, OIF (parcours d'impact mesurable).

## C'est pour quoi faire ? (la promesse + le modèle)
**Promesse : « Apprends. Comprends. Applique. »** Chaque leçon finit par une action.

**Modèle économique (décision fondateur) :**
- **Le contenu est 100% GRATUIT** (cours, leçons, outils, fiches PDF, articles). C'est la
  **matière qui capte l'attention** et fait revenir — exactement ce qui a fait le trafic de
  TutorialsPoint. On « achète l'attention » des gens pour qu'ils restent.
- **Le PAYANT, c'est l'ACCOMPAGNEMENT** humain, demandé volontairement :
  `Tu demandes → Tu t'inscris et tu réserves → Ton espace d'accompagnement` (l'expert te suit
  dans ton compte). C'est là qu'est la rentabilité. **Pas de pub** (elle exige un trafic massif
  qu'on n'a pas encore), **pas de verrou sur le contenu**.

**4 domaines, un expert par domaine :**
1. Santé & Bien-être — *Jemima Kanga*
2. Développement Personnel — *Hervé Mulamba*
3. Finance & Investissement — *Glodi Kambembo, Prince Modju, Salem Balukisa*
4. Technologie Émergente — *Moïse Matondo (fondateur)*

## Périmètre du SITE (ce dépôt), côté Academy
**Inclus (livré, en local ou en ligne) :**
- Accueil dense (hero collage, 4 cartes-domaines, catalogue, derniers articles).
- **Bibliothèque** `/academy/bibliotheque/` : catalogue de tout le contenu classé par domaine.
- **Cours** `/academy/[course]/` + **lecteur de leçon** `/academy/[course]/[lesson]/` (sommaire
  « chemin », précédent/suivant, progression, quiz, **fiche PDF** téléchargeable).
- **Outils** : tableau blanc, calculatrice graphique, compilateur (JS en direct), code de pratique.
- **Comptes** : inscription/connexion (e-mail+mdp & Google), vérif e-mail, mot de passe oublié,
  tableau de bord, **progression** par leçon.
- **Accompagnement** `/academy/accompagnement/` + réservation `/academy/compte/paiement/`.
- **Experts** `/academy/expert/[slug]/`, **recherche** `/academy/recherche/`,
  **À propos**, **Contact**, **Articles** (le blog, dans la coquille Academy).

**Hors périmètre / différé (config back, dernière étape) :** traitement réel du paiement
(Mobile Money + carte), OAuth Google en prod (clés), exécution serveur multi-langages du
compilateur, protection serveur du contenu réservé.

## Reverse engineering — Tutoria Academy vs TutorialsPoint (forme + fond)

| Aspect | TutorialsPoint | Tutoria Academy | État |
|---|---|---|---|
| Barre utilitaire à icônes | ✔ | ✔ | Fait |
| Icônes sociales colorées | ✔ | ✔ (TikTok/YouTube/FB) | Fait |
| Hero dense et illustré | ✔ (arbres, code, graphes) | ✔ (collage 4 domaines) | Fait |
| Méga-menu catégories | ✔ | ✔ (« Domaines ») | Fait |
| Bibliothèque catalogue | ✔ (1200+ tutos, 28 cat.) | ✔ (58+ tutos, 4 domaines) | Fait (à nourrir) |
| Parcours guidés (Learning Paths) | ✔ | ✖ | **À faire** |
| Sommaire d'ancres dans la page | ✔ | ✖ | **À faire** |
| Code **coloré + exécutable** dans les leçons | ✔ | ✖ (blocs plats) | **À faire** |
| Compilateur multi-langages | ✔ (serveur) | Partiel (JS navigateur) | Back |
| Volume de contenu | ✔✔✔ (énorme) | Faible (à produire) | **Fond** |
| Pub | ✔ | ✖ (choix : accompagnement) | Volontaire |
| Fiche PDF de leçon à la charte | ✖ | ✔ | **On les dépasse** |
| Identité visuelle distinctive | ✖ (générique) | ✔ (Bricolage + chemin) | **On les dépasse** |

**Le vrai écart = le FOND (le volume de contenu).** La forme est au niveau (voire au-dessus sur
l'identité et les fiches PDF). Priorité produit : **remplir un domaine de bout en bout** avec un
expert pour prouver le modèle, pendant qu'on finit les détails de forme (points ci-dessus).

## Critères de réussite
- Toute la forme TutorialsPoint répliquée et cohérente (nav, biblio, outils, lecteur). *(en cours)*
- Au moins **1 parcours complet et abouti par domaine**. *(à produire)*
- Le tunnel d'accompagnement fonctionne de bout en bout (demande → inscription → paiement → espace).
  *(front fait ; paiement = back)*
- Un visiteur reste (temps de session, pages/visite) parce qu'il y a de la matière. *(à mesurer)*
