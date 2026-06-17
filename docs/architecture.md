# Architecture

Application web fullstack **Next.js** (App Router) en **TypeScript**, frontend et
backend dans le même projet, structurée en **couches** pour une séparation claire
des responsabilités.

## Stack technique

| Couche | Choix | Justification |
|--------|-------|---------------|
| Framework (front + back) | **Next.js** (App Router) | Imposé. Fullstack : Server Components + Server Actions (mutations) + Route Handlers (endpoints HTTP). |
| Langage | **TypeScript** (`strict`) | Imposé + rigueur de typage attendue. |
| Base de données | **PostgreSQL** (Neon, via le Marketplace Vercel) | SQL relationnel robuste, déployable en serverless, « production-like ». |
| ORM | **Prisma 7** (driver adapter `@prisma/adapter-pg`) | Migrations versionnées, typage généré, schéma lisible. En v7, la datasource ne porte plus l'URL : la connexion passe par un driver adapter fourni au `PrismaClient`. |
| UI | **MUI (Material UI)** | Design system Material complet et cohérent (champs, dialogues, snackbars, DataGrid) ; autorisé — l'interdiction ne vise que les SDK de formulaires tiers. |
| Formulaires & validation | **React Hook Form + Zod** | Formulaires agréables, gestion des erreurs ; Zod = validation partagée client/serveur. |
| Drag & drop (builder) | **dnd-kit** | Réordonnancement des questions. |
| IA | **Claude Haiku 4.5** (`@anthropic-ai/sdk`) | Rapide/économique pour itérer ; **sortie structurée validée par Zod** → résultat fiable et maîtrisé. |
| Tests | **Jest** + **Cypress** | Jest (SWC via `next/jest`) pour l'unitaire et l'intégration (front jsdom / back node) ; Cypress pour l'e2e (navigateur) et le système (API via `cy.request`). |
| CI / CD | **GitHub Actions** + **Vercel** | Tests automatisés sur PR ; déploiement + preview URL. |

## Couches & séparation front / back

Les dépendances pointent **vers le `shared`** : `app` → (`frontend` | `backend`) → `shared`.
Le `shared` ne dépend de rien (domaine pur, réutilisable côté front comme back).

```
src/
  middleware.ts   # garde d'accès : exige une session admin sur /admin/* et /api/admin/*

  app/            # Next.js App Router — points d'entrée (routing)
    (admin)/      #   espace admin PROTÉGÉ : Form Builder, Response Viewer, génération IA (RSC + Server Actions)
    f/[publicId]/ #   Form Responder (PUBLIC) — accès par jeton opaque, formulaires PUBLISHED uniquement
    api/
      admin/      #     Route Handlers PROTÉGÉS : génération IA, opérations builder
      public/     #     Route Handlers PUBLICS : soumission de réponses (write-only)

  frontend/       # FRONTEND — couche présentation
    components/   #   composants UI (PascalCase) : FormBuilder.tsx, QuestionCard.tsx
    hooks/        #   hooks React (camelCase) : useFormBuilder.ts

  backend/        # BACKEND — couche application / métier
    form/         #   formService.ts        (createForm, updateForm, publishForm…)
    response/     #   responseService.ts    (submitResponse, listResponses…)
    ai/           #   aiService.ts          (génération Claude + parsing Zod) — appelable admin uniquement
    auth/         #   adminSession.ts       (création / vérification du cookie de session signé)
    db/           #   db.ts (client Prisma) + repositories

  shared/         # PARTAGÉ — couche domaine (framework-agnostic)
    models/       #   entités / types du domaine (PascalCase) : Form.ts, Question.ts
    schemas/      #   schémas Zod (camelCase) : formSchema.ts, answerSchema.ts
    types/        #   types transverses

prisma/
  schema.prisma   # modèle Form / Question / Option / Response / Answer
tests/            # unitaire & integration (front+back), e2e (front), systeme (back) — voir docs/testing.md
docs/             # documentation (ce dossier)
```

| Dossier | Rôle | Côté |
|---------|------|------|
| `app/` | Points d'entrée Next.js (routing, RSC, Server Actions, Route Handlers) | front + back |
| `frontend/` | Présentation : composants, hooks, vues | **frontend** |
| `backend/` | Métier : services/use-cases, accès données Prisma, intégration IA | **backend** |
| `shared/` | Domaine : entités, types, schémas Zod, règles métier (sans dépendance framework) | **partagé** |

## Conventions de nommage

| Élément | Casse | Exemple |
|---------|-------|---------|
| Composants React, types, interfaces, enums, classes (+ leurs fichiers) | **PascalCase** | `FormBuilder.tsx`, `Question.ts`, `QuestionType` |
| Variables, fonctions, hooks (+ fichiers non-composants) | **camelCase** | `formService.ts`, `useFormBuilder.ts`, `createForm()` |
| Dossiers | **lowercase / kebab-case** | `backend/`, `shared/`, `form/` |

Application par couche :

- **`shared/`** — modèles/entités/enums en **PascalCase** (fichier `Form.ts`, type `Form`, enum `QuestionType`) ; schémas Zod en **camelCase** (fichier `formSchema.ts`, export `formSchema`).
- **`backend/`** — fichiers et fonctions en **camelCase** (`formService.ts` → `createForm()`, `aiService.ts` → `generateForm()`).
- **`frontend/`** — composants en **PascalCase** (`FormBuilder.tsx`, `QuestionCard.tsx`) ; hooks/utils en **camelCase** (`useFormState.ts`).

## Découpage fonctionnel

- **Form Builder** (`app/(admin)` + `frontend` + `backend/form`) — conception des questionnaires. **Admin.**
- **Form Responder** (`app/f/[publicId]` + `backend/response`) — interface publique de réponse. **Public.**
- **Response Viewer** (`app/(admin)` + `backend/response`) — visualisation des réponses. **Admin.**
- **Génération IA** (`app/api/admin/ai` + `backend/ai`) — création d'un questionnaire depuis un prompt. **Admin** (aucune route publique).

## Sécurité & contrôle d'accès

La séparation admin / public est posée sur la **couche d'accès**, pas sur le modèle de données
(qui reste unifié). Trois niveaux :

1. **Routing** — `middleware.ts` exige une session admin sur `/admin/*` et `/api/admin/*`.
   La **génération IA n'a aucune route publique** : elle n'est joignable que derrière le middleware.
2. **Données exposées** — le public lit uniquement la définition d'un `Form` **PUBLISHED** (via `publicId`
   opaque) et reste **write-only** sur les réponses ; l'`id` interne et les réponses d'autrui ne sortent jamais.
3. **Authentification** — **administrateur unique** : identifiants en variables d'environnement
   (`ADMIN_PASSWORD`, `SESSION_SECRET`), session matérialisée par un **cookie signé** (HMAC),
   `httpOnly` + `Secure` + `SameSite`. Pas de table `User`.

Détail complet (validation des entrées, cookies, IA) : [`security.md`](./security.md).

## Choix, arbitrages et limites

- **Prisma vs Drizzle** → Prisma, pour la lisibilité du schéma, les migrations carrées et le rendu à la démo.
- **PostgreSQL/Neon vs SQLite** → Postgres, pour un déploiement Vercel propre et un contexte « production-like ».
- **Claude Haiku 4.5** → démarrage sur Haiku (rapide/économique) ; la sortie étant **contrainte par un schéma Zod**, basculer vers Sonnet/Opus ne change qu'une ligne (`model`).
- **Server Actions vs Route Handlers** → Server Actions pour les mutations internes (builder) ; Route Handlers pour la soumission publique et la génération IA (vrais endpoints HTTP).
- **Auth admin : admin unique vs auth complète** → **admin unique** (cookie signé + identifiants en env, sans table `User`). Suffisant pour le périmètre du cas pratique, sans sur-ingénierie ; l'évolution vers une vraie gestion de comptes (table `User`, rôles, `Form.ownerId`) reste possible sans toucher au cœur du modèle. Voir [`security.md`](./security.md).
- **Limites connues / à arbitrer** : pas de multi-comptes (admin unique), périmètre des types de questions, internationalisation, anti-abus de la soumission publique (rate limiting) hors périmètre.
