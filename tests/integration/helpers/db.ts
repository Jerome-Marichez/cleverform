// Aides BDD pour les tests d'intégration backend.
//
// `resetDatabase` vide les tables métier entre les tests pour garantir l'isolation
// (chaque test part d'une base propre). On opère sur la **vraie** base de test via
// le client Prisma de l'application — pas de mock : ce sont des données réelles
// dans un Postgres dédié.

import { db } from "@/backend/db";

/** Vide toutes les tables métier (ordre géré par CASCADE) et remet les séquences. */
export async function resetDatabase(): Promise<void> {
  await db.$executeRawUnsafe(
    'TRUNCATE TABLE "Answer", "Response", "Option", "Question", "Form" RESTART IDENTITY CASCADE',
  );
}

/** Ferme la connexion Prisma (à appeler en fin de suite). */
export async function disconnectDatabase(): Promise<void> {
  await db.$disconnect();
}
