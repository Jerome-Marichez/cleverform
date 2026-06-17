# Sécurité & contrôle d'accès

Principe directeur : la séparation **admin / public** est portée par la **couche d'accès**
(routing, services), **pas** par une duplication du modèle de données — qui reste unifié
(`Form`, `Question`, `Option`, `Response`, `Answer`). Voir [`data-model.md`](./data-model.md)
et [`architecture.md`](./architecture.md).

## 1. Authentification admin — « administrateur unique »

Pas de table `User`, pas de `Form.ownerId`. Un seul administrateur :

- Identifiants en **variables d'environnement** : `ADMIN_PASSWORD`, `SESSION_SECRET`
  (voir [`.env.example`](../.env.example)). Jamais commitées.
- Connexion : comparaison du mot de passe **en temps constant** (anti timing-attack).
  En production, stocker de préférence un **hash** (argon2/bcrypt) plutôt que le mot de passe en clair.
- Session matérialisée par un **cookie signé** (HMAC avec `SESSION_SECRET`), avec les attributs :
  `httpOnly` (inaccessible au JS), `Secure` (HTTPS uniquement), `SameSite=Lax`, expiration bornée.
- Logique isolée dans `src/service/auth/adminSession.ts` (création + vérification du jeton).

> Arbitrage : l'admin unique suffit au périmètre du cas pratique sans sur-ingénierie. L'évolution
> vers une vraie gestion de comptes (table `User`, rôles, `Form.ownerId`) ne touche pas au cœur du modèle.

## 2. Garde de routing (`middleware.ts`)

Le middleware Next.js exige une session admin valide sur :

- `/admin/*` — Form Builder, Response Viewer, génération IA (UI).
- `/api/admin/*` — Route Handlers admin (génération IA, opérations builder).

Sans session valide → redirection vers la page de connexion (UI) ou `401` (API). La défense est
**aussi rejouée côté service/Server Action** (defense-in-depth) : on ne se repose pas uniquement
sur le middleware.

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

## 4. Génération IA verrouillée

La génération IA n'a **aucune route publique** : c'est un service (`src/service/ai/`) appelable
uniquement depuis l'espace admin (route `/api/admin/ai` ou Server Action admin), donc derrière le
middleware. Le verrou est **structurel** — il n'existe pas de porte d'entrée publique à fermer.

- La clé `ANTHROPIC_API_KEY` reste **côté serveur**, jamais exposée au client.
- La sortie du modèle est **validée par Zod** (`generatedFormSchema`, `src/core/schemas/form.ts`)
  avant toute insertion : un retour non conforme est rejeté, pas inséré.
- Le formulaire généré est créé en `status = DRAFT`, `generatedByAi = true`, `aiPrompt` renseigné
  (traçabilité) ; il n'est public qu'après revue + publication par l'admin.

## 5. Validation des entrées

- **Schémas Zod partagés** (`src/core/schemas/`) appliqués **côté serveur** sur toute entrée :
  soumission publique de réponses et prompt IA. La validation client n'est qu'un confort UX.
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
