# CleverForm

**Mini-clone de Typeform** (_Form Builder & Responder_) — cas pratique technique CleverForm.

Application web fullstack permettant de :

1. **Créer** des questionnaires personnalisables (_Form Builder_).
2. **Diffuser et remplir** les formulaires côté public (_Form Responder_).
3. **Visualiser** les réponses collectées (_Response Viewer_).
4. **Générer** un questionnaire à partir d'un simple prompt (**IA**).

## Contraintes techniques

- **Next.js** (dernière version stable) — frontend + backend, **TypeScript** partout.
- **Base de données** : MySQL, SQLite ou Supabase.
- Bibliothèques tierces libres, **sauf** SDK de services de formulaires (Typeform & équivalents).

## Stack technique

| Couche | Choix |
|--------|-------|
| Framework (front + back) | **Next.js** (App Router) |
| Langage | **TypeScript** (`strict`) |
| Base de données | **PostgreSQL** (Neon, via Vercel) |
| ORM | **Prisma 7** (driver adapter `@prisma/adapter-pg`) |
| Conteneurisation | **Docker** (portabilité / compatibilité ; livraison via Vercel) |
| Commandes | **Make** (interface agnostique) |
| UI | **MUI (Material UI)** — thème clair/sombre, détection système |
| Icônes animées | **lordicon** (`@lordicon/react` + Lottie JSON **auto-hébergés**, sans CDN) |
| Visualisation des composants | **Storybook** (rendu/doc des composants) |
| Formulaires & validation | **React Hook Form + Zod** |
| Drag & drop (builder) | **dnd-kit** |
| IA | **Claude Haiku 4.5** (`@anthropic-ai/sdk`), sortie structurée validée Zod |
| Tests | **Jest** (unitaire + intégration) + **Cypress** (e2e + système) |
| CI / CD | **GitHub Actions** + **Vercel** |

Détails et justifications : [`docs/architecture.md`](./docs/architecture.md).

## Architecture

Séparation claire **frontend / backend** (même dans cette application unique Next.js),
en couches dépendant du `shared` :

```
src/
  middleware.ts # garde d'accès admin (/admin/* et /api/admin/*)
  app/          # Next.js App Router — points d'entrée : pages (front) + routes API (back)
    page.tsx      # page d'accueil PUBLIQUE : présentation + accès à l'espace admin
    admin/        # espace ADMIN protégé — layout (coquille + déconnexion) + tableau de bord (liste des questionnaires) ; Form Builder, Response Viewer, génération IA
    f/[publicId]/ # Form Responder PUBLIC (jeton opaque, formulaires publiés uniquement)
    api/
      admin/    #   routes BACKEND protégées : génération IA, opérations builder, lecture des réponses
      public/   #   routes BACKEND publiques : lecture d'un form publié + soumission de réponses (write-only)
  frontend/     # FRONTEND  — présentation : composants, hooks, vues
  backend/      # BACKEND   — métier : services, accès données (Prisma), intégration IA, session admin
    form/       #   formService (orchestration) + formRepository (Prisma) + formMapper (règles pures)
    response/   #   domaine Réponse : repository (Prisma), service (use-cases), mapper pur (DTO + agrégation)
  shared/       # PARTAGÉ   — domaine : entités, types, schémas Zod (framework-agnostic)
    schemas/    #   schémas Zod & types inférés : CRUD Builder, soumission publique, login, DTO publics
```

Les **schémas de validation** (Zod) vivent dans `src/shared/schemas/` (réexportés via
`@/shared/schemas`) : entrées du Builder (`createFormSchema`, `updateFormSchema`, `reorderSchema`),
soumission publique (`submitResponseSchema` + règles par type), connexion (`loginSchema`) et DTO
publics (`PublicForm`, sans `id` interne). Détail et règles par type : [`docs/data-model.md`](./docs/data-model.md).

L'**administration des questionnaires** est exposée par les routes `/api/admin/forms`
(CRUD + publication/clôture), adossées à la couche `backend/form` (service / repository / règles
pures). Détail des routes et du découpage : [`docs/architecture.md`](./docs/architecture.md).

Le **tableau de bord admin** (`/admin`) — coquille commune (en-tête + déconnexion) et liste des
questionnaires (création, publication / clôture, accès aux réponses, suppression) — lit les données
côté serveur via `listForms()` et délègue les interactions à des composants clients dédiés
(`src/frontend/components/admin/`). Parcours et composants : [`docs/design.md`](./docs/design.md).

Le **Form Builder** (`/admin/forms/[id]/edit`) est l'éditeur visuel de questionnaire :
édition du titre/description, palette des 8 types de questions, réordonnancement **drag & drop**
(questions et options) via `@dnd-kit`, et éditeur d'options pour les types à choix. La logique
d'édition est isolée dans le hook **pur et testable** `useFormBuilder`. Détail UX :
[`docs/design.md`](./docs/design.md).

Le **domaine Réponse** (`src/backend/response/`) sert un questionnaire publié au Responder
(`GET /api/public/forms/[publicId]`), enregistre les soumissions validées
(`POST /api/public/forms/[publicId]/responses`, write-only) et expose l'agrégat au Response Viewer
admin (`GET /api/admin/forms/[id]/responses`). Le mapping DTO et l'agrégation sont une logique
**pure** (testée sans base) ; un `Form` non publié renvoie 404 et l'`id` interne n'est jamais exposé.

La **page de remplissage** (`src/app/f/[publicId]`, Server Component) charge le DTO public côté
serveur puis délègue à `ResponderForm` (React Hook Form + Zod, validation client par le **même**
schéma que le backend). Soumission réussie → écran de remerciement ; questionnaire indisponible →
page 404 dédiée. Voir [`docs/design.md`](./docs/design.md) (section _Form Responder_).

Côté admin, le **Response Viewer** (`/admin/forms/[id]/responses`, Server Component) charge cet
agrégat et le visualise par question — barres horizontales pour les choix, note moyenne pour les
notes, échantillon de valeurs pour les champs libres — avec des primitives MUI uniquement (sans
bibliothèque de graphiques). Détail dans [`docs/design.md`](./docs/design.md).

L'**assistance par IA** (Claude Haiku 4.5, réservée à l'admin) est exposée par deux routes sous
`/api/admin/ai` : `POST /generate` (`{ prompt }`) génère un questionnaire complet à partir d'un sujet
libre, et `POST /proofread` (`{ text }`) corrige l'orthographe/grammaire d'un libellé. La logique
d'**extraction et de validation** de la sortie du modèle est isolée dans une couche **pure**
(`src/backend/ai/aiMapper.ts`) — la réponse JSON est tolérante aux blocs Markdown, validée par
`generatedFormSchema`, puis mappée vers l'entrée de création (un seul retry si le format est invalide)
— ce qui la rend **testable sans clé API ni réseau** (l'appel réseau reste isolé dans `aiClient.ts`).
Côté UI, le dashboard propose un bouton **« Générer par IA »** (boîte de dialogue de prompt avec
exemples, puis redirection vers l'éditeur du questionnaire créé) et le Builder une action
**« Corriger l'orthographe »** sur chaque libellé de question. La clé `ANTHROPIC_API_KEY` reste
serveur, jamais exposée au client. Voir [`docs/architecture.md`](./docs/architecture.md) et
[`docs/security.md`](./docs/security.md).

### Accès & sécurité

Le **Form Builder**, le **Response Viewer** et la **génération IA** sont réservés à un
**administrateur unique** (cookie de session signé, identifiants en variables d'environnement —
pas de table `User`). Le **Form Responder** est la seule surface publique : accès à un formulaire
**publié** via un **identifiant opaque** dans l'URL (`/f/[publicId]`, non devinable), le public
restant **write-only** sur les réponses. La génération IA n'a aucune route publique. Le login admin
est limité en débit par IP (anti-brute-force) et les soumissions publiques sont bornées en taille.
Détails : [`docs/security.md`](./docs/security.md).

## Conventions de nommage

- **PascalCase** : composants React, types, interfaces, enums (+ leurs fichiers) — ex. `FormBuilder.tsx`, `QuestionType`.
- **camelCase** : variables, fonctions, hooks (+ fichiers non-composants) — ex. `formService.ts`, `useFormBuilder.ts`.
- **Dossiers** : minuscules — `backend/`, `frontend/`, `shared/`.

Par couche : `shared/` modèles/types en PascalCase + schémas Zod en camelCase ;
`backend/` fichiers/fonctions en camelCase ; `frontend/` composants en PascalCase, hooks en camelCase.

## Commandes (Make)

Le projet s'utilise via **Make** (interface agnostique — voir [`docs/tooling.md`](./docs/tooling.md)) :

```bash
make install        # dépendances
make dev            # développement local
make build          # build de production
make lint typecheck # qualité
make db-deploy      # applique les migrations Prisma (preprod/prod/CI)
make db-status      # état des migrations vs base
make docker-up      # app + Postgres en local (Docker, compatibilité)
make storybook      # visualisation des composants (Storybook, port 6006)
make help           # liste toutes les cibles
```

> Livraison via **Vercel** ; **Docker** sert la portabilité / les vérifications de compatibilité
> (voir [`docs/docker.md`](./docs/docker.md)).

## Base de données & configuration locale

La base **PostgreSQL (Neon)** est provisionnée via l'**intégration Marketplace Vercel**. En local :

1. `cp .env.example .env`, puis renseigner les **secrets applicatifs** (`ANTHROPIC_API_KEY`,
   `ADMIN_PASSWORD`, `SESSION_SECRET`).
2. `make db-pull` récupère les **variables Neon** dans `.env.local` (`vercel env pull`).
3. `make db-deploy` applique les migrations, `make db-status` vérifie l'état.

En **Prisma 7**, la connexion runtime passe par un *driver adapter* (`DATABASE_URL` poolée) et les
migrations par l'URL **directe** (`DATABASE_URL_UNPOOLED`), configurées dans `prisma.config.ts`.
Répartition **dev / preprod / prod** ↔ branches git : voir [`docs/architecture.md`](./docs/architecture.md) ;
détail Prisma & migrations : [`docs/data-model.md`](./docs/data-model.md).

### Variables d'environnement requises

| Variable | Rôle |
|----------|------|
| `DATABASE_URL` / `DATABASE_URL_UNPOOLED` | Connexion Neon (runtime poolé / migrations directes). |
| `ANTHROPIC_API_KEY` | Clé IA (serveur uniquement). |
| `ADMIN_PASSWORD` | Mot de passe de l'**administrateur unique** (comparé en temps constant). |
| `SESSION_SECRET` | Secret HMAC de signature du **cookie de session** admin. |

L'authentification admin (cookie de session signé HMAC, middleware sur `/admin/*` et `/api/admin/*`,
page `/login`) repose sur `ADMIN_PASSWORD` et `SESSION_SECRET` — voir [`docs/security.md`](./docs/security.md).

## Documentation

La documentation détaillée vit dans le dossier [`docs/`](./docs) :

- [Architecture](./docs/architecture.md) — stack, structure, choix techniques et arbitrages.
- [Design & UX](./docs/design.md) — parcours utilisateur, composants, états de l'interface.
- [Storybook](./docs/storybook.md) — visualisation des composants, thème clair/sombre, conventions des stories.
- [Modèle de données](./docs/data-model.md) — entités (`Form`, `Question`, `Response`, `Answer`) et relations.
- [Sécurité & accès](./docs/security.md) — auth admin unique, cloisonnement admin/public, verrou IA, validation.
- [Tests](./docs/testing.md) — stratégie unitaires / intégration / e2e-système et couverture des composants.
- [CI / CD](./docs/ci-cd.md) — CI à deux niveaux (dev rapide / main long) et déploiement.
- [Docker](./docs/docker.md) — portabilité (anti vendor lock-in), build/run/disponibilité.
- [Outillage (Make)](./docs/tooling.md) — interface de commandes agnostique.
- [Workflow Git](./docs/git-workflow.md) — branches, protection de `main`, cycle des PR.

## Workflow Git

Modèle à **deux branches permanentes** :

| Branche | Rôle |
|---------|------|
| `main` | **Production** — code stable, déployable. **Branche protégée.** |
| `dev` | **Intégration** — développement courant, base des branches de fonctionnalité. |

### Protection de `main`

`main` est une **branche protégée** sur GitHub :

- 🚫 **Aucun push direct** — toute intégration passe par une Pull Request depuis `dev` (ou un hotfix validé).
- ✅ **Checks CI obligatoires au vert** avant fusion (lint, typecheck, tests unitaires / intégration / e2e / système).
- 👀 **Revue approuvée requise**.
- 🔒 **Fusion réservée aux administrateurs** (Jérôme). L'assistant **ouvre et remplit** la PR `dev → main` mais **ne la fusionne / clôture jamais** — même avec **tous les checks au vert**, ceux-ci ne suffisent pas : la mise en production est une **validation humaine**.
- ⛔ **Pas de contournement** des règles.

`dev` est elle aussi protégée : pas de commit direct, PR depuis une branche de fonctionnalité, checks au vert avant fusion. **Nuance clé `dev` vs `main`** : sur `dev`, des checks **au vert suffisent** à fusionner (**auto-merge autorisé**, l'assistant peut fusionner lui-même) ; sur `main`, les checks verts sont **nécessaires mais pas suffisants** — la fusion reste une **validation humaine** (Jérôme).

### Cycle d'une fonctionnalité

1. **Issue GitHub** décrivant le travail.
2. **Branche** dérivée de `dev`, liée à l'issue : `<préfixe>/<n°issue>-<desc>` (ex. `feat/12-form-builder`).
3. **Développement** (+ mise à jour `README` / `docs`).
4. **PR vers `dev`**, remplie (`Closes #<n°>`).
5. **Fusion dans `dev`** dès que tous les checks sont au vert — **auto-merge autorisé** (l'assistant peut fusionner lui-même) ; sinon on corrige jusqu'au vert.
6. **Suppression** de la branche.

Préfixes : `feat/` · `fix/` · `doc/` · `refactor/` · `test/` · `chore/`.

Détails et configuration de la protection : [`docs/git-workflow.md`](./docs/git-workflow.md).
