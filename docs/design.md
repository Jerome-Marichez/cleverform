# Design & UX

## Principes

- Navigation fluide et cohérente entre Builder, Responder et Viewer.
- Formulaires agréables à remplir.
- Gestion explicite des états de **chargement**, d'**erreur** et **vide**.

## Parcours utilisateur

0. **Administrateur** : se connecte à l'espace admin (page de connexion ; admin unique). Sans session valide, `/admin/*` redirige vers la connexion.
1. **Administrateur** : arrive sur le **tableau de bord** (`/admin`) qui liste tous ses questionnaires, puis crée / configure un questionnaire (Form Builder) — ajout, réordonnancement (drag & drop), types de questions, options.
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

La page d'accueil publique (`src/app/page.tsx`) présente CleverForm et oriente vers l'espace admin : `AppHeader` (marque + bascule de thème), un hero centré « CleverForm » avec un sous-titre décrivant le produit (créer, diffuser, visualiser des questionnaires, génération assistée par IA), trois fonctions clés illustrées par des **icônes animées**, et des appels à l'action vers `/admin`. Elle est responsive et **theme-aware** (clair / sombre).

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

## Espace d'administration

### Coquille admin (`src/app/admin/layout.tsx`)

Toutes les pages sous `/admin` partagent une même **coquille** (Server Component) : un `AppHeader` portant la **marque cliquable** (retour au tableau de bord), un **bouton « Déconnexion »** (`LogoutButton`, Client Component : `POST /api/auth/logout` puis redirection vers `/login`) et la **bascule de thème**, le tout au-dessus du contenu de page dans un `PageContainer`. Ce layout est le **seul** porteur de l'en-tête admin : les pages enfants ne le ré-ajoutent pas. L'accès est protégé en amont par le `middleware` (voir [`security.md`](./security.md)).

### Tableau de bord — liste des questionnaires (`src/app/admin/page.tsx`)

Page d'accueil de l'admin (Server Component). Elle lit les questionnaires **directement** via la couche backend (`listForms()`, sans appel HTTP) et les affiche en **grille de cartes** responsive (`FormCard` réutilisé) : titre, statut (brouillon / publié / clôturé), nombre de questions et date de modification. Un clic sur une carte ouvre l'**éditeur** du questionnaire (`/admin/forms/[id]/edit`). En l'absence de questionnaire, un **état vide** (`EmptyState`) invite à en créer un.

Les interactions sont déléguées à des **composants clients** dédiés (`src/frontend/components/admin/`) :

- **`NewFormButton` + `CreateFormDialog`** : bouton « Nouveau questionnaire » ouvrant une boîte de dialogue (titre + description). À la validation, `POST /api/admin/forms` (le questionnaire est amorcé avec une première question, requise par le schéma de création) puis redirection vers l'éditeur. Le titre est requis (validation inline) ; états de chargement et d'erreur gérés.
- **`AdminFormCard` + `FormCardActions`** : menu d'actions superposé à chaque carte — **publier** (brouillon → publié) ou **clôturer** (publié → clôturé) selon le statut, et **supprimer** (avec **confirmation** explicite rappelant le titre). Après chaque mutation réussie, la liste est rafraîchie (`router.refresh()`) et un **toast** (`StatusSnackbar`) confirme l'action ; les erreurs sont signalées de la même façon.
- **Hook `useFormMutations`** (`src/frontend/hooks/`) : encapsule les appels `fetch` (création, changement de statut, suppression) et expose un état transverse `pending` / `error`, pour garder les composants de présentation simples.

### Response Viewer (visualisation des réponses)

La page admin `src/app/admin/forms/[id]/responses/page.tsx` (Server Component, sous la garde admin du middleware) visualise les réponses **agrégées** d'un questionnaire. Elle charge l'agrégat directement côté serveur (`getFormResponsesAggregated(id)` — aucune route appelée depuis le client), renvoie un **404** (`notFound()`) si le questionnaire n'existe pas, et affiche l'**état vide** « Aucune réponse pour le moment » tant qu'aucune soumission n'a été collectée. L'en-tête rappelle le titre, le **nombre total de réponses** et propose un accès à l'édition du questionnaire.

La visualisation par question est assurée par `QuestionAggregateCard` (`src/frontend/components/viewer/`), qui s'adapte à la **famille** de la question (champ `kind` de l'agrégat) :

- **Choix** (`SINGLE_CHOICE` / `MULTIPLE_CHOICE`) → une **barre horizontale** par option (`LinearProgress`), proportionnelle à l'option la plus choisie, avec le libellé, le décompte et le **pourcentage** (rapporté au nombre de réponses).
- **Note** (`RATING`) → la **moyenne** en étoiles `Rating` (lecture seule) doublée d'un texte « x.x / 5 » ; repli explicite si aucune note.
- **Valeur** (texte, nombre, e-mail, date) → un **échantillon** des valeurs saisies, tronqué au-delà d'un seuil (« + N autres ») ; repli « — » si vide.

La carte réutilise les composants existants (`QuestionTypeIcon`, `PageContainer`, `EmptyState`) et ne dépend d'**aucune** bibliothèque de graphiques : tout est construit avec des primitives MUI (barres, étoiles), responsive et **theme-aware**.

## Thème clair / sombre

- **Couleur dominante : le vert** de la marque, décliné en clair **et** en sombre.
- Le thème (`src/frontend/theme.ts`) utilise les **variables CSS** de MUI avec un **sélecteur de classe**
  (`colorSchemeSelector: "class"`) : la bascule peut se faire en JS.
- **Détection système par défaut** : `ThemeProvider` (`defaultMode="system"`) suit la préférence OS
  (`prefers-color-scheme`) ; `InitColorSchemeScript` (dans le layout) applique le bon mode **avant
  l'hydratation** pour éviter tout flash (FOUC).
- L'utilisateur peut basculer **clair / sombre / système** via le composant `ColorModeToggle` ; le
  choix est mémorisé. Le mode clair/sombre s'applique à **tout** le système (admin **et** public).

## Form Builder (éditeur de questionnaire)

Le Form Builder (`/admin/forms/[id]/edit`) est l'interface d'administration de conception d'un questionnaire. Il s'organise en couches claires :

- **Page** (`src/app/admin/forms/[id]/edit/page.tsx`) : Server Component fin qui charge le questionnaire (`getForm`) par sa **clé interne** (jamais l'identifiant public) et délègue l'édition au Client Component `FormBuilder`. Un questionnaire introuvable produit un `notFound()` (404). En Next.js 16, `params` est asynchrone (`Promise`).
- **`FormBuilder`** (`src/frontend/components/builder/FormBuilder.tsx`) : orchestration. Édition du **titre** et de la **description**, **palette** des types, liste de questions réordonnable, et actions **Enregistrer** (PATCH `/api/admin/forms/[id]`) et **Publier** (PATCH `/api/admin/forms/[id]/publish`). Les états de chargement/erreur sont matérialisés par les boutons en `loading` et un `StatusSnackbar` (succès / erreur).
- **`QuestionTypePalette`** : les **8 types** (dérivés de `questionTypeMeta`) ; un clic ajoute une question vide de ce type en fin de liste.
- **`QuestionEditorItem`** : carte d'édition d'une question (libellé, type, switch « obligatoire », suppression) avec **poignée de glisser-déposer**. L'**éditeur d'options** n'apparaît que pour les types à choix (`isChoiceQuestionType` → `SINGLE_CHOICE` / `MULTIPLE_CHOICE`).
- **`OptionsEditor`** : ajout / suppression / saisie / réordonnancement des options d'une question à choix (au moins une option conservée).

**Drag & drop** : `@dnd-kit/core` + `@dnd-kit/sortable` (stratégie verticale) à deux niveaux — réordonnancement des **questions** et des **options** d'une même question. Chaque élément porte un **identifiant local** stable (clé React + cible du tri), distinct de la clé Prisma.

**État & validation** : la logique d'édition est isolée dans le hook `useFormBuilder` (`src/frontend/hooks/useFormBuilder.ts`), **pur et testable** (add / remove / update / reorder, réindexation dense des `order`, contrainte d'options pour les types à choix). Avant tout envoi, l'état est **validé localement** (titre non vide, au moins une question, libellés non vides, options des types à choix), en cohérence avec `updateFormSchema` ; la validation serveur reste l'autorité finale. À l'enregistrement, les questions sont **réindexées** (`order` 0..n selon leur position) puis envoyées en remplacement complet.

## États de l'interface (systématiques)

| État | Traitement |
|------|------------|
| **Chargement** | squelettes / spinners (ex. pendant la génération IA) |
| **Erreur** | message clair + action de reprise ; erreurs de validation inline |
| **Vide** | message d'amorçage (ex. « Aucune réponse pour le moment ») |
| **Succès** | toast de confirmation (création, soumission) |

## Maquettes / wireframes

> _À ajouter (liens ou captures)._
