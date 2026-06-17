# Outillage & commandes (Make)

Le projet expose ses commandes via un **Makefile**, utilisé comme **interface unique**.

## Pourquoi Make plutôt que (seulement) npm

- **Agnostique** : `make build`, `make docker-build`, `make test-e2e`… fonctionnent sans
  connaître l'écosystème Node/npm. Utile dans un **environnement non-Node** (CI hétérogène,
  poste sans toolchain JS, conteneur).
- **Stable** : l'interface (`make <cible>`) ne change pas même si l'implémentation dessous
  évolue (npm → autre runner, ajout de Docker…).
- **Découvrable** : `make help` liste les cibles documentées.

> Make ne **remplace pas** npm (qui reste l'installateur des dépendances Node) : il l'**enveloppe**
> pour offrir une porte d'entrée homogène et portable.

## Cibles principales

| Commande | Effet |
|----------|-------|
| `make install` | Installe les dépendances |
| `make dev` | Serveur de développement (local) |
| `make build` / `make start` | Build / démarrage production (local) |
| `make lint` / `make typecheck` | Qualité |
| `make test-unit` / `make test-integration` | Tests rapides (PR → `dev`) |
| `make test-e2e` / `make test-system` | Tests longs (PR → `main`) |
| `make docker-build` / `make docker-run` / `make docker-up` / `make docker-down` | Docker |
| `make prisma-generate` / `make db-migrate` | Prisma |

`make help` affiche la liste complète.
