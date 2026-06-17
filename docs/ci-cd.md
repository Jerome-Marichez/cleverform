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

### PR → `main` (long, mise en production)

- ✅ **Build local** (`next build`)
- ✅ **Docker** : build de l'image + run + **healthcheck** de disponibilité (portabilité / anti vendor lock-in — voir [`docker.md`](./docker.md))
- ✅ Tests **e2e** (front)
- ✅ Tests **système** (back)

> Les étapes Docker / e2e / système sont coûteuses : les cantonner aux PR vers `main` garde
> les itérations sur `dev` rapides.

## Déploiement (CD) — Vercel

- **Livraison via Vercel** (front + back serverless) + **PostgreSQL** (Neon). Docker n'est pas la
  cible de livraison (Vercel l'est) mais garantit la portabilité.
- **Preview URL** par PR ; **production** sur `main`.

### Variables d'environnement

| Variable | Rôle |
|----------|------|
| `DATABASE_URL` | Connexion PostgreSQL **poolée** (runtime ; lue par le driver adapter Prisma) |
| `DIRECT_URL` | Connexion **directe** (migrations) |
| `ANTHROPIC_API_KEY` | Clé API Claude (serveur uniquement) |
| `ADMIN_PASSWORD` / `SESSION_SECRET` | Authentification de l'espace admin (voir `security.md`) |

## Outils

| Étape | Outil |
|-------|-------|
| CI | **GitHub Actions** (un workflow par check) |
| Interface de commandes | **Make** (mêmes cibles en local et en CI) |
| Conteneurisation | **Docker** (portabilité, healthcheck) |
| Déploiement | **Vercel** |
| Base de données | **PostgreSQL** (Neon) |
