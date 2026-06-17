# Stratégie de tests

Les tests **conditionnent la fusion** d'une PR vers `dev` (voir le workflow Git) :
tant qu'un niveau échoue, la PR n'est pas fusionnée.

Bien que le projet soit **une seule application** Next.js (monolithe fullstack
« entre guillemets »), les tests sont **séparés `frontend` / `backend`** pour qu'on
voie immédiatement *ce qui* est testé : l'**interface** ou le **serveur**.

## Niveaux et découpage front / back

| Niveau | Côté | Objet | Outil |
|--------|------|-------|-------|
| **unitaire** | frontend **+** backend | composants/hooks/utils (front) ; schémas Zod, parsing IA, logique pure (back) | **Jest** (jsdom + Testing Library côté front ; node côté back) |
| **integration** | frontend **+** backend | composant + interactions, fixtures de données (front) ; Server Actions / Route Handlers + Prisma (back) | **Jest** (jsdom / node, fixtures et BDD de test) |
| **e2e** | **frontend uniquement** | parcours navigateur complet (Builder → Responder → Viewer) | **Cypress** E2E |
| **systeme** | **backend uniquement** | scénarios système côté serveur : Route Handlers / API / données, de bout en bout | **Cypress** (`cy.request` — tests API) |

> Deux outils complémentaires : **Jest** (unitaire + intégration, transformé par `next/jest` —
> SWC, résolution de l'alias `@/*`, deux projets *node* / *jsdom*) et **Cypress** (e2e navigateur +
> système API via `cy.request`). Les fichiers se distinguent par leur **extension** :
> `*.test.ts(x)` → Jest, `*.cy.ts(x)` → Cypress.

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
  jest.setup.ts  # matchers @testing-library/jest-dom (chargé par les projets jsdom)
  unitaire/
    frontend/    # composants, hooks, utils UI (Jest + Testing Library, jsdom) — *.test.tsx
    backend/     # schémas Zod, parsing IA, logique pure (Jest, node) — *.test.ts
  integration/
    frontend/    # composant + interactions formulaire (Jest + Testing Library, fixtures) — *.test.tsx
    backend/     # Server Actions / Route Handlers + Prisma (Jest, node, BDD de test) — *.test.ts
  e2e/
    frontend/    # parcours navigateur de bout en bout (Cypress E2E) — *.cy.ts, front uniquement
  systeme/
    backend/     # scénarios système API / serveur / données (Cypress) — *.cy.ts, back uniquement
```

## Lancement

Via **Make** (interface unique — voir [`tooling.md`](./tooling.md)) ou npm :

```bash
make test-unit          # tests unitaires — front + back (Jest)
make test-integration   # tests d'intégration — front + back (Jest)
make test-e2e           # tests e2e — front (Cypress)
make test-system        # tests système — back (Cypress)
npm test                # = jest : unitaire + intégration en une seule passe
```

> `make test-e2e` / `make test-system` lancent le serveur de prod (`npm run start`) via
> `start-server-and-test` avant d'exécuter Cypress — un **`make build` préalable est requis**.
> En itération locale rapide, `npm run test:e2e` exécute Cypress contre un serveur déjà
> démarré (ex. `make dev`).

## Couverture

### Composants frontend (unitaire)

Chaque composant de présentation existant dispose d'un test unitaire ciblé
(`tests/unitaire/frontend/`), monté dans le thème MUI via le helper
`renderWithTheme` (enveloppe `ThemeProvider` + `CssBaseline`, mode clair). Ce
helper évite les avertissements de contexte pour les composants consommant le
thème (`useTheme`) ou le mode de couleur (`useColorScheme`, ex. la bascule de
thème).

Les tests vérifient un **comportement réel** plutôt que la couverture brute :
valeur affichée, déclenchement de `onChange` / `onClick`, états `disabled`,
`required` et `error`, dispatch par type, libellés et accessibilité (rôles et
noms accessibles). Aucun mock : on passe des **props et fixtures réelles**.

Périmètre couvert (regroupé par fichier de test) :

| Fichier de test | Composants |
|-----------------|------------|
| `fields/TextFields.test.tsx` | `ShortTextField`, `LongTextField`, `NumberField`, `EmailField`, `DateField` |
| `fields/ChoiceFields.test.tsx` | `SingleChoiceField`, `MultipleChoiceField`, `RatingField` |
| `fields/QuestionField.test.tsx` | `QuestionField` (dispatch par type, libellé / marqueur requis, erreur inline) |
| `form/FormCard.test.tsx` | `FormCard` (titre, description, compteur, statut, clic) |
| `form/FormStatusChip.test.tsx` | `FormStatusChip` (`DRAFT` / `PUBLISHED` / `CLOSED`) |
| `form/QuestionCard.test.tsx` | `QuestionCard` (libellé, type, ordre, badge obligatoire) |
| `form/QuestionTypeIcon.test.tsx` | `QuestionTypeIcon` (libellé accessible par type) |
| `states/States.test.tsx` | `LoadingState`, `ErrorState`, `EmptyState`, `StatusSnackbar` |
| `Layout.test.tsx` | `AppHeader`, `Logo`, `ColorModeToggle`, `PageContainer` |

### Logique partagée (unitaire, backend)

| Fichier de test | Objet |
|-----------------|-------|
| `backend/form-schema.test.ts` | Validation Zod de la sortie IA (`generatedFormSchema`) |

> Objectif de couverture : pas de seuil chiffré imposé pour l'instant ; la règle
> est qu'**aucun composant ou logique pure ne reste sans test unitaire**.
