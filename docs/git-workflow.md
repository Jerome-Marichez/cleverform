# Workflow Git & protection des branches

Modèle à **deux branches permanentes** : `main` (production) et `dev` (intégration).
**Aucun commit direct** sur ces deux branches — tout passe par des Pull Requests.

## Branches

| Branche | Rôle | Protection |
|---------|------|------------|
| `main` | Production — code stable, déployable | **Protégée** (voir ci-dessous) |
| `dev` | Intégration — base des branches de fonctionnalité | Protégée (PR + checks) |

## Protection de `main` (GitHub)

`main` **doit** être configurée comme **branche protégée** :

- **Require a pull request before merging** — aucun push direct.
- **Require approvals** (≥ 1 revue approuvée).
- **Require status checks to pass before merging** — tous les checks CI au vert (lint, typecheck, tests unitaires / intégration / e2e / système).
- **Require branches to be up to date before merging**.
- **Restrict who can merge** — **administrateurs uniquement** (Jérôme). Les autres contributeurs (dont l'assistant) ne peuvent **pas** clôturer/fusionner une PR vers `main`.
- **Do not allow bypassing the above settings** — pas de contournement.
- _(Optionnel)_ **Require linear history**, **Require conversation resolution before merging**.

> ⚠️ **Règle absolue** : l'assistant **ouvre et remplit** la PR `dev → main` mais ne la **fusionne jamais**. Même avec **tous les checks au vert**, ceux-ci ne suffisent pas : la mise en production est une **validation humaine** réservée à un administrateur.

`dev` est également protégée : pas de commit direct, PR obligatoire depuis une branche de fonctionnalité, checks au vert avant fusion. **Différence clé avec `main`** : sur `dev`, des **checks au vert suffisent** à autoriser la fusion (**auto-merge** possible, y compris par l'assistant) ; sur `main`, les checks au vert sont **nécessaires mais pas suffisants** — la fusion reste réservée à une **validation humaine** (administrateur).

## Configuration

À appliquer **une fois le dépôt créé sur GitHub**.

### Via l'interface

`Settings` → `Rules` → `Rulesets` (ou `Branches`) → règle ciblant `main`, cocher les protections ci-dessus, avec la **liste de contournement limitée aux administrateurs**.

### Via la CLI `gh` (exemple)

```bash
gh api -X PUT repos/<owner>/<repo>/branches/main/protection \
  -H "Accept: application/vnd.github+json" \
  -F "required_pull_request_reviews[required_approving_review_count]=1" \
  -F "required_status_checks[strict]=true" \
  -f "required_status_checks[contexts][]=ci" \
  -F "enforce_admins=true" \
  -F "restrictions=null"
```

> Pour **réserver la fusion aux administrateurs** : sur un dépôt d'organisation, renseigner `restrictions` (utilisateurs/équipes autorisés) ou utiliser un **ruleset** avec liste de contournement limitée aux admins. Sur un dépôt personnel, la fusion est de fait réservée au propriétaire (admin), renforcée par la revue obligatoire.

## Cycle d'une fonctionnalité

1. **Issue GitHub** décrivant le travail.
2. **Branche** dérivée de `dev`, liée à l'issue : `<préfixe>/<n°issue>-<desc>` (ex. `feat/12-form-builder`).
3. **Développement** (+ mise à jour `README` / `docs` impactés).
4. **PR vers `dev`**, remplie (`Closes #<n°>`).
5. **Fusion dans `dev`** dès que **tous les checks passent** (**auto-merge autorisé** — l'assistant peut fusionner lui-même) ; sinon corriger jusqu'au vert.
6. **Suppression** de la branche.
7. **Mise en production** : PR `dev → main`, **fusionnée par un administrateur** après validation.

## Préfixes de branche

`feat/` · `fix/` · `doc/` · `refactor/` · `test/` · `chore/`
