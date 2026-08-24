---
title: "Écris ta première ligne de code"
course: "premiers-pas-code"
order: 1
quiz:
  - q: "Que fait console.log() ?"
    options:
      - { t: "Ça supprime du code" }
      - { t: "Ça affiche un message", correct: true }
      - { t: "Ça éteint l'ordinateur" }
---

Le code, c'est juste des **instructions** que l'ordinateur exécute, une par une. Pas de magie, pas
besoin d'être un génie. On commence tout de suite.

## Afficher un message

En JavaScript, `console.log(...)` affiche ce que tu lui donnes. Clique le bouton **Exécuter** :

```js
console.log("Bonjour, Tutoria !");
console.log("2 + 2 =", 2 + 2);
```

## Ranger une valeur dans une variable

Une **variable**, c'est une boîte avec un nom. Tu y ranges une valeur, puis tu la réutilises.

```js
const prenom = "Salem";
console.log("Salut " + prenom + ", prêt à coder ?");
```

<figure class="ac-figure">
<svg viewBox="0 0 360 120" role="img" aria-label="Une variable relie un nom à une valeur">
  <rect x="14" y="42" width="104" height="36" rx="9" fill="var(--ac-teal)"></rect>
  <text x="66" y="66" text-anchor="middle" fill="#ffffff" font-family="ui-monospace, monospace" font-weight="700" font-size="16">prenom</text>
  <path d="M122 60 H176" fill="none" stroke="var(--ac-ink-soft)" stroke-width="2.5" stroke-linecap="round"></path>
  <path d="M170 54 l8 6 l-8 6" fill="none" stroke="var(--ac-ink-soft)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"></path>
  <rect x="184" y="28" width="162" height="64" rx="13" fill="var(--ac-surface)" stroke="var(--ac-line-strong)" stroke-width="2"></rect>
  <text x="265" y="67" text-anchor="middle" fill="var(--ac-ink)" font-family="ui-monospace, monospace" font-size="19">"Salem"</text>
</svg>
<figcaption>Une <b>variable</b> : un nom (<code>prenom</code>) qui pointe vers une valeur (<code>"Salem"</code>).</figcaption>
</figure>

## À toi de jouer

Remplace le prénom ci-dessus par le tien, puis clique **Exécuter**. Tu viens d'écrire et de lancer
ton propre code : c'est exactement ça, programmer.

> **À retenir.** Coder, c'est donner des instructions claires, dans l'ordre. Tu écris, tu exécutes,
> tu vois le résultat.
