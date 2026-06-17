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

Composants en **PascalCase** (`FormBuilder.tsx`, `QuestionCard.tsx`), hooks en **camelCase** (`useFormBuilder.ts`).

## États de l'interface (systématiques)

| État | Traitement |
|------|------------|
| **Chargement** | squelettes / spinners (ex. pendant la génération IA) |
| **Erreur** | message clair + action de reprise ; erreurs de validation inline |
| **Vide** | message d'amorçage (ex. « Aucune réponse pour le moment ») |
| **Succès** | toast de confirmation (création, soumission) |

## Maquettes / wireframes

> _À ajouter (liens ou captures)._
