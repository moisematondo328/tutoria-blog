---
title: "Comment une IA apprend"
course: "comprendre-ia"
order: 2
quiz:
  - q: "Une IA entraînée seulement sur des exemples de la ville sera :"
    options:
      - { t: "Parfaite partout" }
      - { t: "Moins fiable sur des cas de village qu'elle n'a jamais vus", correct: true }
      - { t: "Incapable de fonctionner" }
---

Apprendre, pour une IA, c'est **s'ajuster** jusqu'à moins se tromper sur des exemples. Pas de
compréhension, un réglage. Voyons comment, sans une seule formule.

## Le principe : essayer, mesurer l'erreur, corriger

Imagine que tu apprennes à viser un panier. Tu lances, tu vois où la balle tombe, tu corriges. Encore,
et encore. Une IA fait ça des millions de fois : elle propose une réponse, on lui montre la bonne, elle
**ajuste ses réglages** pour réduire l'écart. Au bout du compte, elle vise juste sur les exemples vus.

## Les données décident de tout

Une IA ne connaît que ce qu'on lui a montré. Nourris-la d'exemples de Kinshasa uniquement, et elle
sera à l'aise sur Kinshasa, plus fragile ailleurs. C'est la règle d'or :

> Des données biaisées donnent une IA biaisée. Ce qu'elle n'a pas vu, elle le devine mal.

## Pourquoi elle "hallucine" parfois

Quand tu lui poses une question hors de ce qu'elle a bien appris, elle ne dit pas "je ne sais pas".
Elle produit la suite **la plus plausible**, quitte à inventer un nom, une date ou une source. Ce
n'est pas un mensonge, c'est sa mécanique de prédiction poussée là où elle est faible.

## Ce que ça te donne comme réflexe

Deux questions à te poser devant une réponse d'IA : **sur quoi a-t-elle été entraînée** pour ce
sujet, et **est-ce vérifiable** ? Si l'enjeu est important (santé, argent, droit), tu vérifies à la
source. Toujours.

> **À retenir.** Une IA apprend en corrigeant son erreur sur des exemples. Elle vaut ce que valent
> ses données. Hors de sa zone de confort, elle invente du plausible : à toi de vérifier.
