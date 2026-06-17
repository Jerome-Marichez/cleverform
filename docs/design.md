# Design & UX

## Principes

- Navigation fluide et cohérente entre Builder, Responder et Viewer.
- Formulaires agréables à remplir.
- Gestion explicite des états de **chargement**, d'**erreur** et **vide**.

## Parcours utilisateur

0. **Administrateur** : se connecte à l'espace admin (page de connexion ; admin unique). Sans session valide, `/admin/*` redirige vers la connexion.
1. **Administrateur** : crée / configure un questionnaire (Form Builder) — ajout, réordonnancement (drag & drop), types de questions, options.
2. **Répondant** : remplit le formulaire public (Form Responder) via son identifiant opaque `/f/[publicId]` (formulaires publiés uniquement).
3. **Administrateur** : consulte les réponses (Response Viewer) — liste et agrégats.
4. **Génération IA** : depuis l'espace admin, saisit un prompt (sujet), obtient un questionnaire pré-rempli (brouillon), modifiable avant publication.

## Système de composants

- **MUI (Material UI)** pour les composants (boutons, champs, dialogues, snackbars, tableaux/DataGrid) — design system Material cohérent et accessible.
- **Emotion** (`@emotion/react` / `@emotion/styled`) comme moteur de style de MUI ; **thème centralisé** via `ThemeProvider` (couleurs, typographies).
- Intégration **App Router** via `@mui/material-nextjs` (cache Emotion + SSR) ; icônes via `@mui/icons-material`.
- **React Hook Form + Zod** pour les formulaires (champs MUI pilotés par `Controller` ; validation et erreurs inline).
- **dnd-kit** pour le réordonnancement des questions dans le Builder.
- **Storybook** comme surface de **visualisation / documentation** des composants (rendu, états, déclinaison clair/sombre) — voir [`storybook.md`](./storybook.md).

Composants en **PascalCase** (`FormBuilder.tsx`, `QuestionCard.tsx`), hooks en **camelCase** (`useFormBuilder.ts`). Les composants vivent sous `src/frontend/components/`.

## Page d'accueil

La page d'accueil publique (`src/app/page.tsx`) présente CleverConnect et oriente vers l'espace admin : `AppHeader` (marque + bascule de thème), un hero centré « CleverConnect » avec un sous-titre décrivant le produit (créer, diffuser, visualiser des questionnaires, génération assistée par IA), trois fonctions clés illustrées par des **icônes animées**, et des appels à l'action vers `/admin`. Elle est responsive et **theme-aware** (clair / sombre).

## Form Responder (remplissage public)

La page de remplissage (`src/app/f/[publicId]/page.tsx`, Server Component) charge le **DTO public** du questionnaire publié via `getPublicForm(publicId)` — aucune donnée admin ni `id` interne n'est exposée. Un identifiant inexistant, en brouillon ou clos déclenche `notFound()` → écran neutre « Questionnaire indisponible » (`not-found.tsx`, basé sur `ErrorState`), sans révéler la cause exacte (cf. [`security.md`](./security.md)).

Le remplissage proprement dit est délégué au Client Component `ResponderForm` (`src/frontend/components/responder/`) :

- **React Hook Form + Zod** : un `AnswerInput` par question, validé côté client par le **même** schéma que le backend (`buildSubmitResponseSchema(form.questions)`) — règles par type (requis, e-mail, nombre, date, cardinalité des choix). Les erreurs s'affichent **inline** sous chaque question.
- Chaque question est rendue par le dispatcher `QuestionField`. Le hook `useResponderForm` concentre la conversion **valeur d'affichage ⇄ `AnswerInput`** : les champs de choix manipulent des **libellés** d'options, reconvertis en **identifiants** (`selectedOptionIds`) pour le backend.
- **Soumission** : `POST /api/public/forms/[publicId]/responses`. Succès → `ThankYouScreen` (écran de remerciement, le formulaire n'est pas rouvert — surface write-only). Échec → message d'erreur (les `issues` de validation serveur sont agrégées et affichées). Pendant l'envoi : barre de progression + bouton en état chargé, champs désactivés.
- En-tête : titre et description du questionnaire ; mise en page cohérente (`AppHeader`, `PageContainer`, carte MUI), **theme-aware** (clair / sombre).

### Fond pointillé décoratif (`DottedBackground`)

`src/frontend/components/DottedBackground.tsx` rend un **motif de points verts subtil** via un `radial-gradient` répété (`backgroundImage` + `backgroundSize`), sans image ni dépendance externe. La couleur des points dérive du **`secondary` du thème** (vert lime) appliqué à **faible opacité** — légèrement renforcée en mode sombre pour rester lisible : le motif est donc **theme-aware**. Un léger fondu vers les bords (`maskImage`) adoucit le rendu. La couche est purement décorative : `aria-hidden`, `pointerEvents: "none"`, positionnée **derrière** le contenu (`position: absolute`). Elle s'utilise soit en overlay (sans enfant), soit comme conteneur (le contenu est alors empilé au-dessus).

### Icônes animées (lordicon auto-hébergé)

Les icônes animées s'appuient sur `@lordicon/react` (moteur `lottie-web`) avec des fichiers **Lottie JSON stockés localement** dans `public/icons/` (`create.json`, `share.json`, `analyze.json`). **Aucune dépendance CDN ni réseau à l'exécution** : les animations restent disponibles hors-ligne, en Docker et en CI (portabilité).

Le wrapper `src/frontend/components/LordIcon.tsx` :

- charge le lecteur lordicon **uniquement côté client** via `next/dynamic` (`ssr: false`) — `lottie-web` dépend du DOM navigateur (shadow DOM, canvas) et ne peut pas s'exécuter au rendu serveur ; tant qu'il n'est pas chargé, un espace réservé dimensionné est rendu (aucun crash SSR) ;
- pilote l'animation de façon impérative selon la prop `trigger` : `hover` (rejoue au survol), `loop` (rejoue à chaque fin) ou `once` (joue une fois quand le lecteur est prêt) ;
- aligne la teinte sur la couleur **primaire** du thème (icônes colorisables) pour rester cohérent en clair comme en sombre ;
- gère l'accessibilité : décorative par défaut (`aria-hidden`), ou `role="img"` + `aria-label` quand la prop `label` est fournie.

Le lecteur proprement dit est isolé dans `LordIconPlayer.tsx` (chargé dynamiquement) pour cantonner l'import navigateur-only.

## Thème clair / sombre

- **Couleur dominante : le vert** de la marque, décliné en clair **et** en sombre.
- Le thème (`src/frontend/theme.ts`) utilise les **variables CSS** de MUI avec un **sélecteur de classe**
  (`colorSchemeSelector: "class"`) : la bascule peut se faire en JS.
- **Détection système par défaut** : `ThemeProvider` (`defaultMode="system"`) suit la préférence OS
  (`prefers-color-scheme`) ; `InitColorSchemeScript` (dans le layout) applique le bon mode **avant
  l'hydratation** pour éviter tout flash (FOUC).
- L'utilisateur peut basculer **clair / sombre / système** via le composant `ColorModeToggle` ; le
  choix est mémorisé. Le mode clair/sombre s'applique à **tout** le système (admin **et** public).

## États de l'interface (systématiques)

| État | Traitement |
|------|------------|
| **Chargement** | squelettes / spinners (ex. pendant la génération IA) |
| **Erreur** | message clair + action de reprise ; erreurs de validation inline |
| **Vide** | message d'amorçage (ex. « Aucune réponse pour le moment ») |
| **Succès** | toast de confirmation (création, soumission) |

## Maquettes / wireframes

> _À ajouter (liens ou captures)._
