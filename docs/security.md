# Sécurité & contrôle d'accès

Principe directeur : la séparation **admin / public** est portée par la **couche d'accès**
(routing, services), **pas** par une duplication du modèle de données — qui reste unifié
(`Form`, `Question`, `Option`, `Response`, `Answer`). Voir [`data-model.md`](./data-model.md)
et [`architecture.md`](./architecture.md).

## 1. Authentification admin — « administrateur unique » _(implémenté)_

Pas de table `User`, pas de `Form.ownerId`. Un seul administrateur :

- Identifiants en **variables d'environnement** : `ADMIN_PASSWORD`, `SESSION_SECRET`
  (voir [`.env.example`](../.env.example)). Jamais commitées ; le code **échoue clairement**
  si elles sont absentes.
- Connexion : comparaison du mot de passe **en temps constant** (anti timing-attack), sur les
  empreintes HMAC des valeurs pour que la durée ne dépende ni de la longueur ni du contenu attendu.
  En production, stocker de préférence un **hash** (argon2/bcrypt) plutôt que le mot de passe en clair.
- Session matérialisée par un **jeton signé HMAC-SHA256** (clé `SESSION_SECRET`) déposé dans un
  **cookie** nommé `cc_admin_session`, au format `payloadBase64Url.signatureBase64Url`. La charge
  utile porte le sujet (`sub: "admin"`) et une **expiration** (`exp`, 7 jours par défaut).
  Attributs du cookie : `httpOnly` (inaccessible au JS), `Secure` en production (HTTPS uniquement),
  `SameSite=Lax`, `path=/`, `maxAge` borné.
- **Web Crypto API** (`crypto.subtle`) plutôt que `node:crypto` : disponible à la fois dans le
  runtime Node (routes) et dans celui du **middleware** Next.js — d'où des helpers **asynchrones**.
- Logique isolée dans [`src/backend/auth/adminSession.ts`](../src/backend/auth/adminSession.ts) :
  `createSessionToken()`, `verifySessionToken()`, `validateAdminPassword()` + helpers de cookie.

Routes d'authentification (sous `src/app/api/auth/`, hors `/api/admin/*` donc non gardées) :

| Route | Méthode | Effet |
|-------|---------|-------|
| `/api/auth/login`  | `POST` | Valide `loginSchema`, vérifie le mot de passe, pose le cookie. `200` / `401` / `400`. |
| `/api/auth/logout` | `POST` | Efface le cookie (`maxAge=0`). `200` (idempotent). |

La page de connexion [`/login`](../src/app/login/page.tsx) (MUI, React Hook Form + `zodResolver(loginSchema)`)
poste vers `/api/auth/login`, gère chargement/erreur et redirige vers la cible d'origine (`?from=`,
**uniquement si interne** — anti open redirect) ou `/admin`.

> Arbitrage : l'admin unique suffit au périmètre du cas pratique sans sur-ingénierie. L'évolution
> vers une vraie gestion de comptes (table `User`, rôles, `Form.ownerId`) ne touche pas au cœur du modèle.

## 2. Garde de routing (`middleware.ts`) _(implémenté)_

Le middleware Next.js ([`src/middleware.ts`](../src/middleware.ts), `matcher` ci-dessous) exige une
session admin valide sur :

- `/admin/*` — Form Builder, Response Viewer, génération IA (UI).
- `/api/admin/*` — Route Handlers admin (génération IA, opérations builder).

```ts
export const config = { matcher: ["/admin/:path*", "/api/admin/:path*"] };
```

Sans session valide :

- `/api/admin/*` → **`401` JSON** (`{ error }`) — appel programmatique, pas de redirection.
- `/admin/*` → **redirection `302`** vers `/login?from=<chemin demandé>`.

La défense doit être **aussi rejouée côté backend/Server Action** (defense-in-depth) : on ne se
repose pas uniquement sur le middleware.

## 3. Surface publique minimale

| Acteur | Lecture | Écriture |
|--------|---------|----------|
| **Public** | définition d'un `Form` **PUBLISHED** uniquement (questions/options/`required`), via `publicId` | création de `Response` + `Answer` (**write-only**) |
| **Admin** | tout (formulaires, réponses, agrégats) | tout |

- **Identifiant opaque** : l'URL publique utilise `Form.publicId` (jeton `cuid` non séquentiel,
  non devinable) — **pas** l'`id` interne, **pas** un slug lisible dérivé du titre. → pas d'**énumération**.
- **Filtre de statut** : seuls les `Form` `PUBLISHED` sont servis publiquement ; `DRAFT`/`CLOSED` → 404.
- **Pas de fuite** : le public ne reçoit jamais l'`id` interne du formulaire ni les `Response`/`Answer`
  d'autrui. Les services publics ne sélectionnent que les champs nécessaires au rendu/à la soumission.

### Mise en œuvre côté backend (domaine `response`)

Les routes publiques s'appuient sur `src/backend/response/` :

- **404 sur non publié** : `responseRepository.findPublishedFormByPublicId` filtre `status = PUBLISHED`
  directement dans la requête. Un `Form` inexistant, en brouillon ou clos remonte `null` → le service
  lève `FormNotFoundError` → `GET /api/public/forms/[publicId]` répond **404** avec un message
  **générique** (« Questionnaire introuvable. ») : on ne révèle pas l'existence d'un brouillon.
- **Non-exposition de l'`id` interne** : `responseMapper.toPublicForm` construit le DTO `PublicForm`
  **sans recopier** `Form.id` (ni `formId`/`questionId` de structure) — seul `publicId` sort. Fonction
  pure, couverte par un test qui échoue si l'`id` interne apparaît dans le DTO sérialisé.
- **Soumission write-only** : `POST /api/public/forms/[publicId]/responses` valide l'entrée via
  `buildSubmitResponseSchema(form.questions)` (forme + règles par type + questions obligatoires +
  rejet des `questionId` inconnus + rejet des `optionId` n'appartenant pas à la question ciblée)
  avant insertion ; il ne renvoie aucune réponse d'autrui (juste l'`id`/horodatage de la soumission
  créée, `201`). Une entrée invalide → **400**.
- **Lecture réservée à l'admin** : `GET /api/admin/forms/[id]/responses` (par `id` interne) est sous
  la garde admin du middleware (`/api/admin/*`) ; le public n'a aucune route de lecture des réponses.

## 4. Génération IA verrouillée _(implémenté)_

L'assistance IA (génération de questionnaire par prompt + correcteur orthographique) n'a **aucune
route publique** : c'est un service backend (`src/backend/ai/`) exposé uniquement par deux Route
Handlers **sous `/api/admin/ai/*`**, donc derrière le middleware. Le verrou est **structurel** — il
n'existe pas de porte d'entrée publique à fermer.

| Route | Effet |
|-------|-------|
| `POST /api/admin/ai/generate` | `{ prompt }` → questionnaire généré et persisté → 201. |
| `POST /api/admin/ai/proofread` | `{ text }` → `{ corrected }` (correction orthographique/grammaticale). |

- **Défense en profondeur** : en plus du middleware, chaque handler **rejoue la vérification de
  session** via `requireAdmin` (`src/backend/auth/requireAdmin.ts`, qui réutilise `verifySessionToken`
  + `SESSION_COOKIE_NAME`). Une session absente/invalide → **401**, sans qu'aucun appel à l'IA ne
  soit déclenché — ces routes engageant un appel externe coûteux, on ne se repose pas sur le seul
  middleware.
- La clé `ANTHROPIC_API_KEY` reste **côté serveur** (lue dans `aiClient.ts`), jamais exposée au
  client. Si elle est absente, le service échoue clairement (`MissingApiKeyError` → **503**), sans
  fuite de détail.
- La sortie du modèle est **validée par Zod** (`generatedFormSchema`, `src/shared/schemas/form.ts`)
  dans une fonction **pure** (`aiMapper.extractGeneratedForm`) avant toute insertion : un retour non
  conforme (JSON absent/invalide, schéma non respecté) est **rejeté, pas inséré** (`AiGenerationError`
  → **502**). Un **seul retry** est tenté côté service avant d'abandonner.
- Le prompt et le texte à corriger sont eux-mêmes **validés** (`aiGenerateSchema` / `aiProofreadSchema` :
  non vides, longueur bornée) avant tout appel — une entrée vide ou trop longue → **400**.
- Le formulaire généré est créé en `status = DRAFT`, `generatedByAi = true`, `aiPrompt` renseigné
  (traçabilité) ; il n'est public qu'après revue + publication par l'admin.

## 5. Validation des entrées

- **Schémas Zod partagés** (`src/shared/schemas/`) appliqués **côté serveur** sur toute entrée :
  soumission publique de réponses, prompt de génération IA (`aiGenerateSchema`) et texte à corriger
  (`aiProofreadSchema`). La validation client n'est qu'un confort UX.
- À la soumission : vérification que les questions `required` sont remplies, que les valeurs
  correspondent au `type`, et que les options sélectionnées **appartiennent bien** à la question
  ciblée du bon `Form` (pas d'injection d'`optionId` arbitraire).
- **Prisma** (requêtes paramétrées) protège des injections SQL ; suppression en cascade
  (`onDelete: Cascade`) pour la cohérence.

## Limites assumées (hors périmètre)

- Pas de multi-comptes ni de rôles (admin unique).
- Pas de **rate limiting** / anti-abus sur la soumission publique ni sur la génération IA
  (à ajouter pour une mise en production réelle).
- Pas de CAPTCHA ni de protection anti-spam sur le Responder public.
