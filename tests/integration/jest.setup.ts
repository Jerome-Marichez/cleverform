// Setup des tests d'INTÉGRATION backend (environnement node).
//
// Pointe Prisma sur une **BDD de test dédiée** AVANT le chargement des modules
// (db.ts lit DATABASE_URL paresseusement, à la première requête). On n'utilise
// JAMAIS la base de production : un garde-fou refuse toute URL Neon.
//
// Locale (par défaut) : conteneur Postgres `make test-db-up` sur le port 55432.
// CI : `TEST_DATABASE_URL` fournie par le service Postgres du workflow.

const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ??
  "postgresql://test:test@localhost:55432/cleverform_test";

// Garde-fou : ne jamais exécuter les tests d'intégration contre une base Neon
// (production / préproduction). On échoue bruyamment plutôt que de risquer une
// écriture/suppression sur des données réelles.
if (/neon\.tech/i.test(TEST_DATABASE_URL)) {
  throw new Error(
    "Refus : TEST_DATABASE_URL pointe vers une base Neon. Les tests d'intégration n'utilisent qu'une base de test dédiée.",
  );
}

process.env.DATABASE_URL = TEST_DATABASE_URL;
process.env.DIRECT_URL = TEST_DATABASE_URL;

// Secrets applicatifs : valeurs de test déterministes si non fournies par
// l'environnement (login, signature de session). Sans incidence sur la prod.
process.env.SESSION_SECRET ??= "integration-test-session-secret";
process.env.ADMIN_PASSWORD ??= "integration-test-admin-password";
