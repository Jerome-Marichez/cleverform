import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Prisma 7 : la connexion passe par un driver adapter fourni au client.
// L'initialisation est PARESSEUSE : la DATABASE_URL n'est exigée qu'à la
// première utilisation (requête), pas à l'import du module — sinon `next build`
// (qui importe les routes sans base) échouerait. Voir docs/data-model.md.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL est manquante (voir .env.example).");
  }
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}

function getPrismaClient(): PrismaClient {
  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma;
  }
  const client = createPrismaClient();
  // Singleton (évite la saturation des connexions en dev/serverless).
  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = client;
  }
  return client;
}

// Proxy : le vrai client n'est créé qu'au premier accès à une propriété de `db`
// (ex. `db.form.findMany`), donc l'import seul ne requiert pas DATABASE_URL.
export const db = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    const client = getPrismaClient();
    const value = Reflect.get(client, prop, receiver);
    return typeof value === "function" ? (value.bind(client) as unknown) : value;
  },
});
