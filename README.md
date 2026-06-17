# CleverConnect

**Mini-clone de Typeform** (_Form Builder & Responder_) — cas pratique technique CleverConnect.

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
| UI | **MUI (Material UI)** |
| Formulaires & validation | **React Hook Form + Zod** |
| Drag & drop (builder) | **dnd-kit** |
| IA | **Claude Haiku 4.5** (`@anthropic-ai/sdk`), sortie structurée validée Zod |
| Tests | **Cypress** (Component + E2E + API) |
| CI / CD | **GitHub Actions** + **Vercel** |

Détails et justifications : [`docs/architecture.md`](./docs/architecture.md).

## Architecture

Séparation claire **frontend / backend** (même dans cette application unique Next.js),
en couches dépendant du `core` :

```
src/
  middleware.ts # garde d'accès admin (/admin/* et /api/admin/*)
  app/          # Next.js App Router — points d'entrée : pages (front) + routes API (back)
    (admin)/      # espace ADMIN protégé : Form Builder, Response Viewer, génération IA
    f/[publicId]/ # Form Responder PUBLIC (jeton opaque, formulaires publiés uniquement)
    api/
      admin/    #   routes BACKEND protégées : génération IA, opérations builder
      public/   #   routes BACKEND publiques : soumission de réponses (write-only)
  interface/    # FRONTEND  — présentation : composants, hooks, vues
  service/      # BACKEND   — métier : services, accès données (Prisma), intégration IA, session admin
  core/         # PARTAGÉ   — domaine : entités, types, schémas Zod (framework-agnostic)
```

### Accès & sécurité

Le **Form Builder**, le **Response Viewer** et la **génération IA** sont réservés à un
**administrateur unique** (cookie de session signé, identifiants en variables d'environnement —
pas de table `User`). Le **Form Responder** est la seule surface publique : accès à un formulaire
**publié** via un **identifiant opaque** dans l'URL (`/f/[publicId]`, non devinable), le public
restant **write-only** sur les réponses. La génération IA n'a aucune route publique. Détails :
[`docs/security.md`](./docs/security.md).

## Conventions de nommage

- **PascalCase** : composants React, types, interfaces, enums (+ leurs fichiers) — ex. `FormBuilder.tsx`, `QuestionType`.
- **camelCase** : variables, fonctions, hooks (+ fichiers non-composants) — ex. `formService.ts`, `useFormBuilder.ts`.
- **Dossiers** : minuscules — `service/`, `interface/`, `core/`.

Par couche : `core/` modèles/types en PascalCase + schémas Zod en camelCase ;
`service/` fichiers/fonctions en camelCase ; `interface/` composants en PascalCase, hooks en camelCase.

## Commandes (Make)

Le projet s'utilise via **Make** (interface agnostique — voir [`docs/tooling.md`](./docs/tooling.md)) :

```bash
make install        # dépendances
make dev            # développement local
make build          # build de production
make lint typecheck # qualité
make docker-up      # app + Postgres en local (Docker, compatibilité)
make help           # liste toutes les cibles
```

> Livraison via **Vercel** ; **Docker** sert la portabilité / les vérifications de compatibilité
> (voir [`docs/docker.md`](./docs/docker.md)).

## Documentation

La documentation détaillée vit dans le dossier [`docs/`](./docs) :

- [Architecture](./docs/architecture.md) — stack, structure, choix techniques et arbitrages.
- [Design & UX](./docs/design.md) — parcours utilisateur, composants, états de l'interface.
- [Modèle de données](./docs/data-model.md) — entités (`Form`, `Question`, `Response`, `Answer`) et relations.
- [Sécurité & accès](./docs/security.md) — auth admin unique, cloisonnement admin/public, verrou IA, validation.
- [Tests](./docs/testing.md) — stratégie unitaires / intégration / e2e-système.
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
