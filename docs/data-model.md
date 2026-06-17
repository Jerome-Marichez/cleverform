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
