import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Prisma 7 : la datasource ne porte plus l'URL — la connexion passe par un
// driver adapter fourni au constructeur du client. Voir docs/data-model.md.
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL est manquante (voir .env.example).");
}

const adapter = new PrismaPg({ connectionString });

// Client Prisma en singleton (évite la saturation des connexions en dev/serverless).
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
