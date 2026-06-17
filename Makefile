# Interface de commandes du projet — AGNOSTIQUE.
# Avantage vs npm : une même commande (`make build`, `make docker-build`…) marche
# quel que soit l'outillage sous-jacent et sans connaître l'écosystème Node.
# `make` ou `make help` liste les cibles.

IMAGE ?= cleverconnect
PORT  ?= 3000

.PHONY: help install ci-install dev build start lint typecheck \
        test-unit test-integration test-e2e test-system \
        prisma-generate db-migrate docker-build docker-run docker-up docker-down

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

test-integration: ## Tests d'intégration — front + back (Jest)
	npm run test:integration

test-e2e: ## Tests e2e — front (Cypress) : build requis (make build), serveur lancé auto
	npx start-server-and-test "npm run start" http://localhost:3000 "npm run test:e2e"

test-system: ## Tests système — back (Cypress) : build requis (make build), serveur lancé auto
	npx start-server-and-test "npm run start" http://localhost:3000 "npm run test:system"

prisma-generate: ## Génère le client Prisma
	npm run prisma:generate

db-migrate: ## Applique les migrations Prisma
	npm run db:migrate

docker-build: ## Construit l'image Docker
	docker build -t $(IMAGE) .

docker-run: ## Lance l'app dans un conteneur Docker
	docker run --rm -p $(PORT):3000 $(IMAGE)

docker-up: ## Lance app + base via docker compose (compatibilité locale)
	docker compose up --build

docker-down: ## Arrête docker compose
	docker compose down
