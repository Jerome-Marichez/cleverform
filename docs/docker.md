# Docker

## Pourquoi Docker ici

La **livraison se fait via Vercel** (convivialité, démo technique, deadline). Docker
n'est **pas** la cible de production — il sert à **garantir la portabilité** :

- Vérifier que l'app **build et tourne hors de l'écosystème Next.js / Vercel** : si une
  fonctionnalité ne passait pas sur Vercel, on peut sortir du **vendor lock-in** sans tout réécrire.
- Assurer en **local** (frontend + backend + base) une **compatibilité** indépendante de la machine.
- Fournir un **healthcheck** automatisé (build + run + disponibilité) dans la CI de mise en production.

## Fichiers

- `Dockerfile` — build multi-étapes, sortie **standalone** Next.js (`output: "standalone"`), image finale minimale.
- `.dockerignore` — réduit le contexte (exclut docs, tests, `node_modules`, secrets…).
- `docker-compose.yml` — exécution locale **app + PostgreSQL** pour vérifier la compatibilité.

## Commandes (via Make)

```bash
make docker-build   # construit l'image
make docker-run     # lance l'app seule (port 3000)
make docker-up      # app + Postgres (compose) — compatibilité locale
make docker-down    # arrête compose
```

## CI

Le workflow **`ci-main-docker.yml`** (PR → `main`) construit l'image, lance le conteneur et
vérifie la **disponibilité** (`curl` sur `/`). Voir [`ci-cd.md`](./ci-cd.md).
