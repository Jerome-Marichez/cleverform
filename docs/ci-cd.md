# CI / CD

Pour la **rapidité**, la CI est **à deux niveaux** : les checks rapides tournent à chaque
PR vers `dev` ; les checks longs sont réservés à la mise en production (PR vers `main`).

## Workflows GitHub Actions

| Workflow | Déclencheur | Jobs |
|----------|-------------|------|
| `.github/workflows/ci-dev.yml` | **PR → `dev`** | `Lint & types` ; `Tests unitaires & intégration` (Cypress) |
| `.github/workflows/ci-main.yml` | **PR → `main`** | `Build local (next build)` ; `Docker — build/run/disponibilité` ; `Tests e2e (front)` ; `Tests système (back)` |

### PR → `dev` (rapide)

- ✅ **Lint** (ESLint) + **typecheck** (`tsc --noEmit`)
- ✅ Tests **unitaires** + **intégration** (Cypress)

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
| CI | **GitHub Actions** (2 workflows) |
| Conteneurisation | **Docker** (portabilité, healthcheck) |
| Déploiement | **Vercel** |
| Base de données | **PostgreSQL** (Neon) |
