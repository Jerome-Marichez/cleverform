# Modèle de données

Modèle **relationnel** (PostgreSQL via Prisma), simple mais bien normalisé.

## Entités principales

- **Form** — un questionnaire (titre, description, identifiant public, statut, provenance IA).
- **Question** — une question d'un `Form` (libellé, type, obligatoire, ordre).
- **Option** — un choix possible d'une `Question` (pour les types à choix).
- **Response** — une soumission complète d'un `Form` par un répondant.
- **Answer** — la réponse à une `Question` au sein d'une `Response`.

> **Pas d'entité `User`.** L'accès admin repose sur un **administrateur unique** (cookie de
> session signé, identifiants en variables d'environnement) : aucune table utilisateur, donc
> aucun `Form.ownerId`. La séparation admin / public est portée par la **couche d'accès**
> (middleware + services), pas par une duplication d'entités — détails dans [`security.md`](./security.md).

## Identité interne vs. exposition publique

Deux identifiants distincts sur `Form`, par sécurité :

| Champ | Rôle | Exposé au public ? |
|-------|------|--------------------|
| `id` | Clé primaire interne, support des relations (FK), opérations admin. | **Jamais** |
| `publicId` | Jeton **opaque** (cuid) de l'URL publique `/f/[publicId]`. | Oui |

`publicId` est non séquentiel et non devinable → pas d'**énumération** des formulaires. Il est
**découplé** de l'identité interne : on peut régénérer le lien de partage (rotation du `publicId`)
sans casser les clés étrangères. C'est un jeton opaque, **pas un slug lisible** (un slug dérivé du
titre serait devinable).

## Relations

```
Form 1 ─── n Question 1 ─── n Option
Form 1 ─── n Response 1 ─── n Answer
Question 1 ─── n Answer
Answer n ─── n Option        (options sélectionnées, pour les choix multiples)
```

## Schéma Prisma (proposition)

```prisma
enum FormStatus {
  DRAFT
  PUBLISHED
  CLOSED
}

enum QuestionType {
  SHORT_TEXT
  LONG_TEXT
  SINGLE_CHOICE
  MULTIPLE_CHOICE
  RATING
  NUMBER
  EMAIL
  DATE
}

model Form {
  id            String     @id @default(cuid())     // clé interne — jamais exposée
  title         String
  description   String?
  publicId      String     @unique @default(cuid()) // URL publique : /f/[publicId]
  status        FormStatus @default(DRAFT)          // seul PUBLISHED est lisible publiquement
  generatedByAi Boolean    @default(false)          // provenance : créé via génération IA
  aiPrompt      String?                             // prompt source (traçabilité)
  questions     Question[]
  responses     Response[]
  createdAt     DateTime   @default(now())
  updatedAt     DateTime   @updatedAt
}

model Question {
  id        String       @id @default(cuid())
  form      Form         @relation(fields: [formId], references: [id], onDelete: Cascade)
  formId    String
  label     String
  type      QuestionType
  required  Boolean      @default(false)
  order     Int
  options   Option[]
  answers   Answer[]
}

model Option {
  id         String   @id @default(cuid())
  question   Question @relation(fields: [questionId], references: [id], onDelete: Cascade)
  questionId String
  label      String
  order      Int
  answers    Answer[] @relation("AnswerSelectedOptions")
}

model Response {
  id          String   @id @default(cuid())
  form        Form     @relation(fields: [formId], references: [id], onDelete: Cascade)
  formId      String
  submittedAt DateTime @default(now())
  answers     Answer[]
}

model Answer {
  id              String   @id @default(cuid())
  response        Response @relation(fields: [responseId], references: [id], onDelete: Cascade)
  responseId      String
  question        Question @relation(fields: [questionId], references: [id], onDelete: Cascade)
  questionId      String
  value           String?  // texte libre, nombre, email, date, note (sérialisé)
  selectedOptions Option[] @relation("AnswerSelectedOptions") // pour SINGLE/MULTIPLE_CHOICE
}
```

## Notes

- Les **types de questions** sont centralisés dans l'enum `QuestionType`, réutilisé côté front (rendu) et back (validation Zod).
- `Answer.value` stocke les réponses « scalaires » ; `Answer.selectedOptions` couvre les choix.
- Suppression en cascade (`onDelete: Cascade`) pour garder la base cohérente.
- La **génération IA** est un **mode de création** d'un `Form` (pas une entité à part) : elle produit
  un objet validé par le schéma Zod `generatedFormSchema` (`src/shared/schemas/form.ts`), inséré via Prisma
  en `status = DRAFT` avec `generatedByAi = true` et `aiPrompt` renseigné. L'admin relit/édite puis publie.
- Le `status` pilote la **visibilité publique** : `DRAFT` (en cours / brouillon IA) et `CLOSED`
  renvoient un 404 public ; seul `PUBLISHED` est servi sur `/f/[publicId]`.

## Schémas d'entrée & validation (Zod)

Le domaine partagé (`src/shared/schemas/`, framework-agnostique) regroupe les **schémas Zod**
et **types inférés** qui valident chaque entrée et décrivent les sorties publiques. Trois familles
distinctes, à ne pas confondre :

| Famille | Fichier | Sens | Usage |
|---------|---------|------|-------|
| **Sortie IA** | `form.ts` | sortie | valide ce que l'IA **produit** avant insertion (`generatedFormSchema`) |
| **Entrée Builder** | `formInput.ts` | entrée | valide ce que l'admin **envoie** (création / mise à jour / réordonnancement) |
| **Soumission publique** | `response.ts` | entrée | valide ce que le public **soumet** (réponses) |
| **DTO publics** | `publicForm.ts` | sortie | types exposés au Responder (**sans `id` interne**) |
| **Auth admin** | `auth.ts` | entrée | mot de passe de connexion |

Tout est réexporté depuis `src/shared/schemas/index.ts` (`import { … } from "@/shared/schemas"`).
Messages d'erreur **en français**. Schémas en **camelCase**, types/DTO en **PascalCase**.

### Schémas d'entrée du Builder (`formInput.ts`)

- `optionInputSchema` — `{ label (non vide), order (entier ≥ 0) }`.
- `questionInputSchema` — `{ label (non vide), type, required, order, options[] }`.
  Une règle **`superRefine`** lie les options au type : les options sont **requises et non vides
  uniquement** pour `SINGLE_CHOICE` / `MULTIPLE_CHOICE`, et **interdites** pour les autres types.
- `createFormSchema` — `{ title (non vide), description?, questions[] (≥ 1) }`.
- `updateFormSchema` — mise à jour **partielle** (PATCH) : `title?`, `description?`, `status?`
  (`DRAFT`/`PUBLISHED`/`CLOSED`), `questions?` ; **au moins un champ** doit être fourni.
- `reorderSchema` — `{ orderedIds[] }` : liste ordonnée d'identifiants **uniques** et non vides
  (l'ordre du tableau définit la nouvelle position).

### Soumission publique & règles par type (`response.ts`)

`submitResponseSchema` valide d'abord la **forme** brute d'une soumission :
`{ answers: [{ questionId, value? , selectedOptionIds? }] }` (au moins une réponse). Une réponse
porte au plus l'un des deux supports : `value` (scalaire) **ou** `selectedOptionIds` (choix),
en miroir de `Answer.value` / `Answer.selectedOptions`.

Les **règles métier par type** ne sont applicables qu'avec la définition du questionnaire (type +
`required`), que seul le backend détient. Elles sont portées par la fonction **pure**
`validateAnswerForType(type, answer, required)` (retourne `{ valid: true }` ou
`{ valid: false; error }`) et par le schéma paramétré `buildSubmitResponseSchema(questions)`
(forme + règles + présence des questions obligatoires + rejet des `questionId` inconnus) :

| Type | Règle (réponse non vide) |
|------|--------------------------|
| `SHORT_TEXT`, `LONG_TEXT` | texte non vide |
| `EMAIL` | format e-mail (`x@y.z`) |
| `NUMBER` | nombre fini |
| `RATING` | entier ≥ 0 |
| `DATE` | date valide (`Date.parse`) |
| `SINGLE_CHOICE` | **exactement 1** option sélectionnée |
| `MULTIPLE_CHOICE` | **au moins 1** option sélectionnée |

> **Contrat « requis »** : une question **facultative** laissée vide est toujours acceptée
> (court-circuit) ; une question **obligatoire** vide est rejetée. Les règles de format ci-dessus
> ne s'appliquent qu'à une réponse effectivement renseignée.

### DTO publics (`publicForm.ts`) — frontière de sécurité

`PublicForm` / `PublicQuestion` / `PublicOption` décrivent la **sortie** servie au Responder.
Ils n'exposent **jamais** l'`id` interne du `Form` (seul `publicId`), ni les champs admin
(`aiPrompt`, `generatedByAi`, timestamps) ni les `formId`/`questionId` de structure — uniquement
ce qui est nécessaire au remplissage. Voir [`security.md`](./security.md).

## Surface de données par acteur

| Acteur | Lecture | Écriture |
|--------|---------|----------|
| **Public** (Responder) | définition d'un `Form` **PUBLISHED** uniquement (questions/options/`required`), via `publicId` | création de `Response` + `Answer` (write-only) |
| **Admin** (Builder / Viewer / IA) | tout (`Form`, `Question`, `Response`, `Answer`, agrégats) | tout |

Le public ne reçoit jamais l'`id` interne du `Form`, ni les `Response`/`Answer` d'autrui. Voir
[`security.md`](./security.md).

## Configuration Prisma 7 & migrations

En **Prisma 7**, la `datasource` du schéma ne porte **plus** l'URL de connexion : le client
runtime se connecte via un **driver adapter** (`@prisma/adapter-pg`, dans `src/backend/db.ts`),
et le **CLI** (migrations) lit sa configuration dans **`prisma.config.ts`** (à la racine).

### Deux connexions, deux usages

| Variable | Connexion | Usage |
|----------|-----------|-------|
| `DATABASE_URL` | **poolée** (PgBouncer, hôte `...-pooler...`) | **runtime** serverless — lue par le driver adapter |
| `DATABASE_URL_UNPOOLED` | **directe** (sans pooler) | **migrations** Prisma (CLI) — exposée ainsi par Neon ; `DIRECT_URL` est accepté comme alias |

`prisma.config.ts` charge `.env` puis `.env.local` (priorité à ce dernier, géré par
`vercel env pull`) et résout l'URL directe (`DIRECT_URL` sinon `DATABASE_URL_UNPOOLED`).

### Cycle de migration

```bash
make db-migrate   # en dev : crée une migration depuis le schéma et l'applique (prisma migrate dev)
make db-deploy    # en preprod/prod/CI : applique les migrations versionnées (prisma migrate deploy)
make db-status    # vérifie l'état (migrations appliquées vs base)
```

Les migrations versionnées vivent dans `prisma/migrations/` (la migration initiale `0_init`
crée les tables `Form` / `Question` / `Option` / `Response` / `Answer` et les enums).

> Note : le driver `pg` émet un avertissement `sslmode` sur les URLs Neon (`sslmode=require`).
> Non bloquant ; la connexion (TLS) fonctionne. Voir [`architecture.md`](./architecture.md) pour
> la répartition par environnement (dev / preprod / prod).
