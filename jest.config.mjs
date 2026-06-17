import nextJest from "next/jest.js";

// `next/jest` gère pour nous la transformation SWC (TS/JSX), la résolution des
// alias `@/*` (lue depuis tsconfig) et l'import des fichiers CSS/statics.
const createJestConfig = nextJest({ dir: "./" });

// Quatre projets reflétant la matrice **niveau × côté** (voir docs/testing.md) :
//  - unit-backend         : node   — schémas Zod, mappers, logique pure (sans BDD)
//  - unit-frontend        : jsdom  — composants, hooks (Testing Library + jest-dom)
//  - integration-backend  : node   — Route Handlers + services + Prisma sur BDD de
//                           test réelle (setup `tests/integration/jest.setup.ts`)
//  - integration-frontend : jsdom  — composant + interactions (fixtures)
// `jest tests/unitaire` ou `jest tests/integration` filtrent par chemin.
const config = async () => {
  const unitBackend = await createJestConfig({
    displayName: "unit-backend",
    testEnvironment: "node",
    testMatch: ["<rootDir>/tests/unitaire/backend/**/*.test.{ts,tsx}"],
  })();

  const unitFrontend = await createJestConfig({
    displayName: "unit-frontend",
    testEnvironment: "jsdom",
    setupFilesAfterEnv: ["<rootDir>/tests/jest.setup.ts"],
    testMatch: ["<rootDir>/tests/unitaire/frontend/**/*.test.{ts,tsx}"],
  })();

  const integrationBackend = await createJestConfig({
    displayName: "integration-backend",
    testEnvironment: "node",
    // Pointe DATABASE_URL sur la BDD de test AVANT le chargement des modules.
    setupFiles: ["<rootDir>/tests/integration/jest.setup.ts"],
    testMatch: ["<rootDir>/tests/integration/backend/**/*.test.{ts,tsx}"],
  })();

  const integrationFrontend = await createJestConfig({
    displayName: "integration-frontend",
    testEnvironment: "jsdom",
    setupFilesAfterEnv: ["<rootDir>/tests/jest.setup.ts"],
    testMatch: ["<rootDir>/tests/integration/frontend/**/*.test.{ts,tsx}"],
  })();

  return {
    projects: [unitBackend, unitFrontend, integrationBackend, integrationFrontend],
  };
};

export default config;
