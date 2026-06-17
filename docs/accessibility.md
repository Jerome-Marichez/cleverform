# Accessibilité

L'accessibilité est traitée comme une exigence de premier ordre, pas comme une
finition. L'objectif : une application utilisable au **clavier**, lisible par les
**lecteurs d'écran**, confortable pour les personnes **sensibles au mouvement**, et
correctement **contrastée** en thème clair comme sombre. Le socle MUI fournit déjà
beaucoup ; ce document décrit les choix propres au projet et ce qui les vérifie.

## 1. Structure du document

- `lang="fr"` déclaré sur `<html>` (voir `src/app/layout.tsx`) : la langue est
  annoncée aux technologies d'assistance.
- **Points de repère** (`landmarks`) : un `<main>` explicite par page (accueil,
  espace admin), un `<header>` (`AppHeader`) et des sections labellisées
  (`aria-label`) là où c'est utile (ex. mention de confidentialité du Responder).
- **Hiérarchie de titres** cohérente : un seul `<h1>` par page, puis `<h2>`…
  Les composants `Typography` dissocient le style visuel (`variant`) de la
  sémantique (`component`) — ex. `variant="h2" component="h1"`.

## 2. Images et icônes

- Pas d'images décoratives porteuses d'information : le fond pointillé
  (`DottedBackground`) est `aria-hidden` et `pointer-events: none`.
- Les icônes animées (`LordIcon`) sont **décoratives par défaut** (`aria-hidden`) ;
  dès qu'une `label` est fournie, elles deviennent `role="img"` + `aria-label`.

## 3. Navigation au clavier et focus

- Tous les contrôles interactifs sont des éléments natifs/MUI (boutons, liens,
  champs, `RadioGroup`, `Rating`, drag & drop `@dnd-kit`) qui gèrent nativement le
  focus et les raccourcis clavier.
- Un **anneau de focus visible et cohérent** est défini globalement dans le thème
  (`MuiCssBaseline` → `:focus-visible`), avec une couleur dérivée de la primaire du
  thème (donc adaptée au clair/sombre). `:focus-visible` n'apparaît qu'au clavier,
  pas au clic souris, pour ne pas alourdir l'interface au pointeur.

## 4. Réduction du mouvement (`prefers-reduced-motion`)

Les personnes ayant activé « réduire les animations » au niveau du système voient
les animations et transitions neutralisées :

- **CSS globale** (`src/app/globals.css`) : sous `@media (prefers-reduced-motion:
  reduce)`, les durées d'animation/transition sont ramenées à ~0 et le défilement
  passe en `auto`.
- **Garde JavaScript** : le hook `useReducedMotion` (`src/frontend/hooks/`) expose
  la préférence pour les effets pilotés en JS, que la CSS seule ne peut pas
  désactiver. Il s'appuie sur `useMediaQuery` de MUI (aucune dépendance ajoutée).
  Exemple : `LordIcon` cesse de tourner **en boucle** et retombe sur un
  déclenchement au survol.

## 5. Contrastes et thème clair/sombre

Les couleurs sont centralisées dans `src/frontend/theme.ts` (palette clair **et**
sombre, primaire éclaircie en sombre pour préserver le contraste). Le mode suit la
**préférence système** par défaut et reste basculable (`ColorModeToggle`), sans
saut de contraste.

## 6. Vérification automatisée

Un test unitaire frontend utilise **jest-axe** pour scanner la page d'accueil et
échouer en cas de violation d'accessibilité, **en thème clair et sombre** :
`tests/unitaire/frontend/accessibility.test.tsx`. Il s'exécute avec la suite
unitaire (`make test-unit` / `npm run test:unit`) et conditionne donc la fusion au
même titre que les autres tests. Voir [`testing.md`](./testing.md).

> La vérification automatisée ne remplace pas un contrôle manuel (navigation au
> clavier de bout en bout, lecteur d'écran) : elle attrape les régressions
> courantes et garde le sujet sous surveillance continue.
