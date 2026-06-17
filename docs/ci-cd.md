# CI / CD

Pour la **rapidité**, la CI est **à deux niveaux** : les checks rapides tournent à chaque
PR vers `dev` ; les checks longs sont réservés à la mise en production (PR vers `main`).

## Workflows GitHub Actions

Un **fichier par check** (un workflow = un job), pour rester lisible. Le modèle reste
**à deux niveaux** via le déclencheur : préfixe `ci-dev-*` (PR → `dev`, rapide) et
`ci-main-*` (PR → `main`, long).

Chaque workflow exécute ses étapes via les **cibles Make** (`make ci-install`, `make lint`,
`make test-unit`, `make build`, `make docker-build`…) : l'interface d'exécution est **la même
en local et en CI** (voir [`tooling.md`](./tooling.md)). `make ci-install` fait un `npm ci`
(install reproductible depuis le lockfile).

| Workflow | Déclencheur | Job |
|----------|-------------|-----|
| `.github/workflows/ci-dev-lint.yml` | **PR → `dev`** | `Lint & types` |
| `.github/workflows/ci-dev-tests.yml` | **PR → `dev`** | `Tests unitaires & intégration` (Jest) |
| `.github/workflows/ci-main-build.yml` | **PR → `main`** | `Build local (next build)` |
| `.github/workflows/ci-main-docker.yml` | **PR → `main`** | `Docker — build/run/disponibilité` |
| `.github/workflows/ci-main-e2e.yml` | **PR → `main`** | `Tests e2e (front)` |
| `.github/workflows/ci-main-system.yml` | **PR → `main`** | `Tests système (back)` |

### PR → `dev` (rapide)

- ✅ **Lint** (ESLint) + **typecheck** (`tsc --noEmit`)
- ✅ Tests **unitaires** + **intégration** (Jest)

> Le workflow `ci-dev-tests.yml` provisionne un **service Postgres éphémère**
> (`postgres:16-alpine`) pour l'**intégration** : `TEST_DATABASE_URL` pointe sur ce
> service, `make test-db-prepare` y applique le schéma (`prisma migrate deploy`),
> puis `make test-integration` s'exécute. Cette base de **test dédiée** n'est
> **jamais** la base Neon de production (garde-fou anti-prod dans le setup Jest).

### PR → `main` (long, mise en production)

- ✅ **Build local** (`next build`)
- ✅ **Docker** : build de l'image + run + **healthcheck** de disponibilité (portabilité / anti vendor lock-in — voir [`docker.md`](./docker.md))
- ✅ Tests **e2e** (front)
- ✅ Tests **système** (back)

> Les étapes Docker / e2e / système sont coûteuses : les cantonner aux PR vers `main` garde
> les itérations sur `dev` rapides.

> Les workflows `ci-main-e2e.yml` / `ci-main-system.yml` provisionnent eux aussi un
> **service Postgres** : le serveur (`make build` + `npm run start`) tourne contre la
> **BDD de test** (`DATABASE_URL` du service, schéma via `make test-db-prepare`), avec
> un `ADMIN_PASSWORD` / `SESSION_SECRET` de test déterministes — **jamais** la base
> Neon de production. Cypress s'authentifie via `CYPRESS_ADMIN_PASSWORD`.

## Déploiement (CD) — Vercel

- **Livraison via Vercel** (front + back serverless) + **PostgreSQL** (Neon). Docker n'est pas la
  cible de livraison (Vercel l'est) mais garantit la portabilité.
- **Preview URL** par PR ; **production** sur `main`.
- Le client **Prisma** est généré au build via le script **`build`** (`prisma generate && next build`),
  afin que `next build` dispose des types générés (sans base requise à la génération). Sur Vercel,
  qui lance `npm run build`, la génération est ainsi automatique ; le Dockerfile l'obtient via la
  même commande de build.

### Variables d'environnement

La base **Neon** est provisionnée via l'**intégration Marketplace Vercel**, qui injecte
automatiquement les variables de connexion dans les trois environnements (Production / Preview /
Development) — voir la répartition par branche dans [`architecture.md`](./architecture.md).

| Variable | Rôle | Source |
|----------|------|--------|
| `DATABASE_URL` | Connexion PostgreSQL **poolée** (runtime ; lue par le driver adapter Prisma) | Neon (auto) |
| `DATABASE_URL_UNPOOLED` | Connexion **directe** (migrations Prisma) — alias accepté : `DIRECT_URL` | Neon (auto) |
| `ANTHROPIC_API_KEY` | Clé API Claude (serveur uniquement) | à définir |
| `ADMIN_PASSWORD` / `SESSION_SECRET` | Authentification de l'espace admin (voir `security.md`) | à définir |

Les **migrations** sont appliquées avec `make db-deploy` (`prisma migrate deploy`) — sur la base
de l'environnement ciblé — après mise à jour des variables.

### Secrets en CI (GitHub Actions)

Aucune valeur sensible n'est **codée en dur** dans les workflows. Les variables sont injectées
depuis les **GitHub Actions Secrets** via `${{ secrets.* }}` (bloc `env:` au niveau du job) :
`DATABASE_URL`, `DATABASE_URL_UNPOOLED` (→ `DIRECT_URL`), `ADMIN_PASSWORD`, `SESSION_SECRET`,
`ANTHROPIC_API_KEY`. Un secret **non défini** vaut une chaîne vide : sans impact sur la CI actuelle
(tests sur **fixtures**, build sans base grâce à l'initialisation **paresseuse** de Prisma). Le
smoke test **Docker** conserve un **repli** sur une URL factice si le secret est absent.

Définition des secrets (par l'administrateur) : *Settings → Secrets and variables → Actions*, ou en
CLI `gh secret set <NOM>`. Le fichier versionné **`.env.example`** ne contient **que des noms de
variables, valeurs vides** — jamais de secret. Les valeurs réelles vivent dans `.env` / `.env.local`
(gitignorés) en local, dans **Vercel** au runtime, et dans les **GitHub Secrets** pour la CI.

### Déploiements Preview & branches Neon

Avec le **preview branching** activé (voir [`architecture.md`](./architecture.md)), chaque
déploiement **Preview** reçoit les variables de connexion de **sa** branche Neon, **injectées au
déploiement via webhook** (elles surchargent les variables Preview du projet, le temps de ce
déploiement, et ne sont pas visibles dans les réglages). La branche étant copiée depuis la prod,
elle **hérite du schéma** — rien à faire pour la plupart des PR.

> Pour une PR **introduisant une nouvelle migration**, la faire appliquer à la branche Preview en
> définissant la *Build Command* Vercel sur `prisma migrate deploy && npm run build`
> (Settings → Build and Deployment). Ne **pas** mettre `migrate deploy` dans le script npm `build` :
> il casserait la CI et le build Docker, qui s'exécutent **sans base**.

## Outils

| Étape | Outil |
|-------|-------|
| CI | **GitHub Actions** (un workflow par check) |
| Interface de commandes | **Make** (mêmes cibles en local et en CI) |
| Conteneurisation | **Docker** (portabilité, healthcheck) |
| Déploiement | **Vercel** |
| Base de données | **PostgreSQL** (Neon) |
