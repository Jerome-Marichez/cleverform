# Interface de commandes du projet — AGNOSTIQUE.
# Avantage vs npm : une même commande (`make build`, `make docker-build`…) marche
# quel que soit l'outillage sous-jacent et sans connaître l'écosystème Node.
# `make` ou `make help` liste les cibles.

IMAGE ?= cleverform
PORT  ?= 3000

# BDD de test dédiée (intégration/système) — JAMAIS la base Neon de prod.
TEST_DB_URL ?= postgresql://test:test@localhost:55432/cleverform_test

.PHONY: help install ci-install dev build start lint typecheck \
        test-unit test-integration test-e2e test-system \
        test-db-up test-db-down test-db-prepare \
        storybook build-storybook \
        prisma-generate db-migrate db-deploy db-status db-pull \
        docker-build docker-run docker-up docker-down

help: ## Affiche cette aide
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-18s\033[0m %s\n", $$1, $$2}'

install: ## Installe les dépendances (local)
	npm install

ci-install: ## Installe les dépendances en mode reproductible (CI — lockfile)
	npm ci

dev: ## Serveur de développement (local, hors Docker)
	npm run dev

build: ## Build de production (local)
	npm run build

start: ## Démarre le build de production (local)
	npm run start

lint: ## Lint (ESLint)
	npm run lint

typecheck: ## Vérification des types (tsc)
	npm run typecheck

test-unit: ## Tests unitaires — front + back (Jest)
	npm run test:unit

test-integration: ## Tests d'intégration — back (Jest + BDD de test). Démarrer `make test-db-up` d'abord.
	npm run test:integration

test-db-up: ## Démarre la BDD de test (conteneur Postgres, port 55432) et applique le schéma
	docker run -d --name cleverform-test-db \
		-e POSTGRES_USER=test -e POSTGRES_PASSWORD=test -e POSTGRES_DB=cleverform_test \
		-p 55432:5432 postgres:16-alpine
	@echo "Attente de Postgres..."
	@until docker exec cleverform-test-db pg_isready -U test -d cleverform_test >/dev/null 2>&1; do sleep 1; done
	@$(MAKE) test-db-prepare

test-db-prepare: ## Applique les migrations Prisma sur la BDD de test
	DIRECT_URL="$(TEST_DB_URL)" npx prisma migrate deploy

test-db-down: ## Arrête et supprime la BDD de test
	-docker rm -f cleverform-test-db

test-e2e: ## Tests e2e — front (Cypress) : build requis (make build), serveur lancé auto
	npx start-server-and-test "npm run start" http://localhost:3000 "npm run test:e2e"

test-system: ## Tests système — back (Cypress) : build requis (make build), serveur lancé auto
	npx start-server-and-test "npm run start" http://localhost:3000 "npm run test:system"

storybook: ## Lance Storybook (visualisation des composants, port 6006)
	npm run storybook

build-storybook: ## Build statique de Storybook
	npm run build-storybook

prisma-generate: ## Génère le client Prisma
	npm run prisma:generate

db-migrate: ## Crée + applique une migration en dev (prisma migrate dev)
	npm run db:migrate

db-deploy: ## Applique les migrations existantes (preprod/prod/CI — prisma migrate deploy)
	npm run db:deploy

db-status: ## État des migrations vs base (prisma migrate status)
	npm run db:status

db-pull: ## Récupère les variables d'env Vercel/Neon dans .env.local (vercel env pull)
	npm run db:pull-env

docker-build: ## Construit l'image Docker
	docker build -t $(IMAGE) .

docker-run: ## Lance l'app dans un conteneur Docker
	docker run --rm -p $(PORT):3000 $(IMAGE)

docker-up: ## Lance app + base via docker compose (compatibilité locale)
	docker compose up --build

docker-down: ## Arrête docker compose
	docker compose down
