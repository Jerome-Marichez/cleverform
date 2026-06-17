# Stratégie de tests

Les tests **conditionnent la fusion** d'une PR vers `dev` (voir le workflow Git) :
tant qu'un niveau échoue, la PR n'est pas fusionnée.

Bien que le projet soit **une seule application** Next.js (monolithe fullstack
« entre guillemets »), les tests sont **séparés `frontend` / `backend`** pour qu'on
voie immédiatement *ce qui* est testé : l'**interface** ou le **serveur**.

## Niveaux et découpage front / back

| Niveau | Côté | Objet | Outil |
|--------|------|-------|-------|
| **unitaire** | frontend **+** backend | composants/hooks/utils (front) ; schémas Zod, parsing IA, logique pure (back) | **Cypress** Component Testing (front) ; specs unitaires (back) |
| **integration** | frontend **+** backend | composant + interactions, fixtures de données (front) ; Server Actions / Route Handlers + Prisma (back) | **Cypress** (Component + `cy.request`, BDD de test) |
| **e2e** | **frontend uniquement** | parcours navigateur complet (Builder → Responder → Viewer) | **Cypress** E2E |
| **systeme** | **backend uniquement** | scénarios système côté serveur : Route Handlers / API / données, de bout en bout | **Cypress** (`cy.request` — tests API) |

> Outillage unique : **Cypress** — *Component Testing* (composants), *E2E* (navigateur) et tests **API** via `cy.request`.

Règle de découpage :

- Un **test e2e** simule un utilisateur dans le **navigateur** → il n'existe que **côté frontend**.
- Un **test système** valide le **serveur** (API, persistance) sans interface → il n'existe que **côté backend**.

## Politique de création des tests

- **Tests unitaires — systématiques et automatiques.** Dès qu'on crée ou modifie un
  composant ou de la logique, le test unitaire correspondant est écrit **sans demander**
  (dans `tests/unitaire`, côté `frontend` ou `backend`).
- **Tests d'intégration et système / e2e — sur validation.** On **vérifie d'abord** qu'un
  test pertinent existe ; s'il en manque un que le composant justifie (frontière
  API / Prisma / BDD / IA pour l'intégration ; parcours utilisateur critique pour le
  système / e2e), il **n'est pas créé d'office** : il est **proposé** pour validation
  avant ajout.
- **Pas de mocks.** On privilégie des **fixtures** (jeux de données de test) plutôt que
  des mocks, pour des tests plus proches du réel et plus stables.

> Cette politique est rappelée automatiquement après chaque modification de code par un
> hook local (`PostToolUse` dans `.claude/settings.local.json`).

## Structure

```
tests/
  unitaire/
    frontend/    # composants, hooks, utils UI (Cypress Component Testing)
    backend/     # schémas Zod, parsing IA, logique pure (Cypress)
  integration/
    frontend/    # composant + interactions formulaire (fixtures de données)
    backend/     # Server Actions / Route Handlers + Prisma (BDD de test)
  e2e/
    frontend/    # parcours navigateur de bout en bout (Cypress E2E) — front uniquement
  systeme/
    backend/     # scénarios système API / serveur / données — back uniquement
```

## Lancement

> Scripts à câbler dans `package.json` une fois le projet Next.js initialisé.

```bash
npm run test:unit          # tests unitaires (front + back)
npm run test:integration   # tests d'intégration (front + back)
npm run test:e2e           # tests e2e (front)
npm run test:system        # tests système (back)
npm test                   # tout
```

## Couverture

> _À documenter : périmètre couvert, objectifs de couverture éventuels._
