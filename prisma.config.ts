import { config } from "dotenv";
import { defineConfig } from "prisma/config";

// Configuration CLI Prisma 7 — voir docs/data-model.md.
// En Prisma 7, la datasource du schéma ne porte plus l'URL : le client runtime passe par un
// driver adapter (src/backend/db.ts, via DATABASE_URL poolée), tandis que le CLI (migrations)
// lit l'URL ici. On utilise l'URL DIRECTE (non poolée) pour les migrations.
//
// Prisma 7 ne charge plus le .env automatiquement quand un prisma.config.ts est présent :
// on charge donc .env puis .env.local (ce dernier, géré par `vercel env pull`, a priorité).
config({ path: ".env" });
config({ path: ".env.local", override: true });

// L'intégration Neon (Marketplace Vercel) expose l'URL directe sous DATABASE_URL_UNPOOLED ;
// en local/docker on peut fournir DIRECT_URL (prioritaire). On n'utilise PAS le helper env()
// de Prisma (qui lève une erreur si la variable est absente) : ainsi `prisma generate`
// fonctionne sans base configurée (ex. en CI, où generate ne se connecte pas). Les commandes
// de migration, elles, échoueront clairement si l'URL est vide.
const directUrl =
  process.env.DIRECT_URL ?? process.env.DATABASE_URL_UNPOOLED ?? "";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: directUrl,
  },
});
