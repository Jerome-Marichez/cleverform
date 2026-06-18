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
| `make install` | Installe les dépendances (local, `npm install`) |
| `make ci-install` | Installe les dépendances en mode reproductible (CI, `npm ci`) |
| `make dev` | Serveur de développement (local) |
| `make build` / `make start` | Build / démarrage production (local) |
| `make lint` / `make typecheck` | Qualité |
| `make test-unit` / `make test-integration` | Tests rapides **Jest** (PR → `dev`) |
| `make test-e2e` / `make test-system` | Tests longs **Cypress** (PR → `main`) — serveur orchestré via `start-server-and-test` (`make build` préalable) |
| `make docker-build` / `make docker-run` / `make docker-up` / `make docker-down` | Docker |
| `make prisma-generate` | Génère le client Prisma |
| `make db-migrate` | Crée + applique une migration en dev (`prisma migrate dev`) |
| `make db-deploy` | Applique les migrations existantes — preprod/prod/CI (`prisma migrate deploy`) |
| `make db-status` | État des migrations vs base (`prisma migrate status`) |
| `make db-pull` | Récupère les variables Vercel/Neon dans `.env.local` (`vercel env pull`) |

`make help` affiche la liste complète.

## Assistant IA de développement (Claude Code)

Le développement s'appuie aussi sur **Claude Code** (assistant IA d'Anthropic en ligne
de commande) comme **outil d'aide au développement** : génération et refactorisation de
code, rédaction de **tests** et de **documentation**, revue, et déroulé du **workflow Git**
(issue → branche → Pull Request).

### Niveau d'autonomie (système agent + branches)

L'assistant opère selon le **modèle agent par branche** du projet (voir
[`git-workflow.md`](./git-workflow.md)) : pour chaque tâche il **crée l'issue**, **dérive
une branche** de `dev` (`feat/` · `fix/` · `doc/`…), **développe** (code + tests + doc),
**ouvre la Pull Request** et **suit la CI**.

- **Autonome jusqu'à `dev`** : dès que **tous les checks CI sont au vert**, l'assistant
  **peut fusionner lui-même** la PR de la branche de fonctionnalité dans `dev`
  (**auto-merge autorisé**) puis supprimer la branche.
- **Non autonome sur la production** : pour `dev → main`, l'assistant **ouvre et remplit**
  la PR mais **ne la fusionne jamais** — la mise en production est une **validation
  humaine** (Jérôme), même avec tous les checks au vert.
- **Branche `main` protégée** : aucun push direct, PR obligatoire, checks verts + revue ;
  l'assistant **ne contourne pas** cette protection.

Garde-fous — l'assistant **s'inscrit dans l'outillage existant, sans le contourner** :

- il passe par les **mêmes cibles Make** (`make lint`, `make typecheck`, `make test-*`…)
  que le poste local et la CI ;
- tout le code produit franchit la **même CI** (lint, types, tests unitaires / intégration
  / e2e / système) et la **même revue** avant fusion (voir [`ci-cd.md`](./ci-cd.md) et
  [`git-workflow.md`](./git-workflow.md)) ;
- il ne **désactive ni n'affaiblit** aucun test ni contrôle CI/CD ; la mise en production
  (`dev → main`) reste une **validation humaine**.

> L'assistant est un **accélérateur**, pas une autorité : les contrôles automatisés et la
> revue humaine restent la source de vérité sur la qualité et la mise en production.

## Make en CI/CD

Les workflows GitHub Actions n'appellent **pas** `npm` / `docker` en direct : ils passent par
les **mêmes cibles Make** que le poste local (`make ci-install`, `make prisma-generate`,
`make lint`, `make typecheck`, `make test-unit`, `make test-integration`, `make build`,
`make test-e2e`, `make test-system`, `make docker-build`). Une **seule interface** de
commandes, identique en local et en intégration continue (voir [`ci-cd.md`](./ci-cd.md)).
