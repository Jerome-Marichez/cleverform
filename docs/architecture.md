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
    form/         #   formService.ts (orchestration) + formRepository.ts (Prisma) + formMapper.ts (règles pures)
    response/     #   responseService.ts    (submitResponse, listResponses…)
    ai/           #   aiService.ts (orchestration) + aiClient.ts (réseau) + aiMapper.ts (parsing/validation Zod purs) — admin uniquement
    auth/         #   adminSession.ts (cookie de session signé) + requireAdmin.ts (garde rejouée côté handler)
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

## Couche Form (administration des questionnaires)

La gestion des questionnaires côté admin est découpée en **trois sous-couches**
(`src/backend/form/`), pour isoler la logique testable de l'accès aux données :

| Fichier | Rôle | Dépend de la base ? |
|---------|------|---------------------|
| `formMapper.ts` | Transformations et **règles PURES** : attribution des `order`, construction de la forme de création imbriquée (`toCreateData`), extraction des champs scalaires d'une mise à jour, **transitions de statut** (`canPublish`, `canClose`, `canTransition`), réordonnancement (`applyReorder`). | **Non** (testé unitairement) |
| `formRepository.ts` | Accès Prisma pur (CRUD `Form` + `Question` + `Option` imbriqués via `db`). Le remplacement des questions lors d'une mise à jour est **transactionnel** (suppression en cascade puis recréation). | Oui |
| `formService.ts` | **Orchestration** : valide les entrées via les schémas partagés (`@/shared/schemas`), applique les règles du mapper, délègue au repository, lève des **erreurs métier typées** (`FormNotFoundError`, `InvalidStatusTransitionError`). | via le repository |

Cycle de vie d'un questionnaire : `DRAFT → PUBLISHED → CLOSED` (transitions
contrôlées, `CLOSED` terminal).

### Routes API admin (`/api/admin/forms`)

Route Handlers Next (sous `src/app/api/admin/`), protégés par `middleware.ts` ; la
logique est **déléguée au service** et les erreurs traduites en codes HTTP
(`formHttp.ts` : 400 validation Zod / 404 introuvable / 409 transition invalide / 500) :

| Méthode & route | Action |
|-----------------|--------|
| `GET /api/admin/forms` | Liste les questionnaires. |
| `POST /api/admin/forms` | Crée un questionnaire (body validé par `createFormSchema`) → 201. |
| `GET /api/admin/forms/[id]` | Détail d'un questionnaire (questions/options triées par `order`). |
| `PATCH /api/admin/forms/[id]` | Mise à jour (body validé par `updateFormSchema`). |
| `DELETE /api/admin/forms/[id]` | Suppression (cascade questions/options/réponses) → 204. |
| `PATCH`/`POST /api/admin/forms/[id]/publish` | Change le statut (publication / clôture) ; body optionnel `{ status }`, défaut `PUBLISHED`. |

## Couche IA (assistance par IA — admin uniquement)

L'assistance par IA (génération de questionnaire par prompt + correcteur
orthographique) suit le **même découpage en sous-couches** que la couche Form,
pour garder la logique exploitable **testable sans clé API, sans réseau et sans
base** (contrainte CI : voir [`testing.md`](./testing.md)) :

| Fichier (`src/backend/ai/`) | Rôle | Dépend du réseau / de la base ? |
|---------|------|---------------------|
| `aiMapper.ts` | Logique **PURE** : extraction du JSON de la réponse IA (tolère les fences ```` ```json ````), validation via `generatedFormSchema` (`extractGeneratedForm`), **mapping** `GeneratedForm → CreateFormInput` (`toCreateFormInput` : options `string[]` → objets `{ label, order }`, `order` séquentiels), nettoyage du texte corrigé (`cleanProofreadOutput`). | **Non** (testé unitairement par fixtures) |
| `aiClient.ts` | Couche **réseau fine** : instancie le SDK Anthropic et émet la requête (`callClaude`). Lit `ANTHROPIC_API_KEY` côté serveur. **Non testée unitairement.** | Oui (réseau) |
| `aiService.ts` | **Orchestration** : `generateForm(prompt)` (prompt système strict → `callClaude` → `extractGeneratedForm` → **un seul retry** si format invalide → `toCreateFormInput` → `createForm(..., { generatedByAi, aiPrompt })`) et `proofread(text)`. | via `aiClient` + `formService` |
| `aiErrors.ts` / `aiHttp.ts` | Erreur typée `AiGenerationError` (sortie inexploitable) + traduction HTTP (`toAiErrorResponse`). | Non |

> **Isolation testable, load-bearing.** `aiService.ts` importe transitivement
> `formService → formRepository → db` (qui exige `DATABASE_URL` au chargement). La
> logique pure vit donc dans `aiMapper.ts`, **sans** cette dépendance : les tests
> unitaires importent `aiMapper.ts` directement et ne déclenchent jamais de
> connexion Prisma ni d'appel réseau.

> **Modèle utilisé : Claude Haiku 4.5** (`claude-haiku-4-5-20251001`) — on
> privilégie une IA pertinente et **stable** (rapide, économique) ; la sortie
> étant **contrainte par un schéma Zod**, basculer vers un modèle plus puissant
> ne change qu'une constante.

### Routes API IA (`/api/admin/ai`)

Route Handlers protégés par `middleware.ts`, avec **vérification de session
rejouée** dans le handler (`requireAdmin`, défense en profondeur — ces routes
déclenchent un appel externe coûteux). Erreurs traduites par `aiHttp.ts` :
401 (session) / 400 (entrée Zod) / **502** (l'IA renvoie un format inexploitable) /
**503** (clé API absente) / 500.

| Méthode & route | Action |
|-----------------|--------|
| `POST /api/admin/ai/generate` | Body `{ prompt }` → génère et persiste un questionnaire (origine `{ generatedByAi: true, aiPrompt }`) → 201. |
| `POST /api/admin/ai/proofread` | Body `{ text }` → `{ corrected }` (texte corrigé). |

Côté UI : un bouton « Générer par IA » (dashboard) ouvre une boîte de dialogue de
prompt (avec exemples) puis redirige vers l'éditeur du questionnaire créé ; une
action « Corriger l'orthographe » est proposée sur chaque libellé de question
dans le Builder.

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

## Environnements (dev / preprod / prod)

La base **Neon** est provisionnée via l'**intégration Marketplace Vercel** (elle injecte
automatiquement `DATABASE_URL`, `DATABASE_URL_UNPOOLED`, etc. dans le projet). Les environnements
s'alignent sur les **branches git** et les **environnements Vercel**, avec une **isolation par base**
assurée par le **preview branching** de Neon :

| Logique | Branche git | Environnement Vercel | Base Neon |
|---------|-------------|----------------------|-----------|
| **prod** | `main` | **Production** | branche principale (`production`) |
| **preprod** | `dev` (et toute branche en PR) | **Preview** | branche **isolée par déploiement** (copy-on-write, auto) |
| **dev** (local) | local | **Development** (`.env.local`) | branche principale (via `make db-pull`) |

> **Preview branching** : l'intégration Neon crée une **branche Neon isolée (copy-on-write) par
> déploiement Preview** (dont `dev`). Comme elle est copiée depuis la prod, elle **hérite du schéma
> et des données** au moment du branchement — aucune migration à rejouer, sauf si la PR introduit une
> nouvelle migration. Les variables de connexion de la branche sont **injectées au déploiement via
> webhook** (elles n'apparaissent pas dans les env vars du projet), et la branche est **supprimée
> automatiquement** quand le déploiement est retiré.
>
> Activation (une fois) : Vercel → **Storage** → base Neon → **Connect Project** →
> *Advanced Options → Deployments Configuration* → activer **Preview** (+ *Resource must be active
> before deployment*). En local, `make db-pull` récupère les variables *Development* dans `.env.local`.

Détail des variables et du flux de déploiement : [`ci-cd.md`](./ci-cd.md). Configuration Prisma
et migrations : [`data-model.md`](./data-model.md).

## Choix, arbitrages et limites

- **Prisma vs Drizzle** → Prisma, pour la lisibilité du schéma, les migrations carrées et le rendu à la démo.
- **PostgreSQL/Neon vs SQLite** → Postgres, pour un déploiement Vercel propre et un contexte « production-like ».
- **Claude Haiku 4.5** → démarrage sur Haiku (rapide/économique) ; la sortie étant **contrainte par un schéma Zod**, basculer vers Sonnet/Opus ne change qu'une ligne (`model`).
- **Server Actions vs Route Handlers** → Server Actions pour les mutations internes (builder) ; Route Handlers pour la soumission publique et la génération IA (vrais endpoints HTTP).
- **Auth admin : admin unique vs auth complète** → **admin unique** (cookie signé + identifiants en env, sans table `User`). Suffisant pour le périmètre du cas pratique, sans sur-ingénierie ; l'évolution vers une vraie gestion de comptes (table `User`, rôles, `Form.ownerId`) reste possible sans toucher au cœur du modèle. Voir [`security.md`](./security.md).
- **Limites connues / à arbitrer** : pas de multi-comptes (admin unique), périmètre des types de questions, internationalisation, anti-abus de la soumission publique (rate limiting) hors périmètre.
