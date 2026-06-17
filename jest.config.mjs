import nextJest from "next/jest.js";

// `next/jest` gère pour nous la transformation SWC (TS/JSX), la résolution des
// alias `@/*` (lue depuis tsconfig) et l'import des fichiers CSS/statics.
const createJestConfig = nextJest({ dir: "./" });

// Deux projets pour refléter la séparation front / back (voir docs/testing.md) :
// - backend  : environnement Node  (schémas Zod, services, logique pure)
// - frontend : environnement jsdom (composants, hooks) + matchers jest-dom
// `jest tests/unitaire` ou `jest tests/integration` filtrent ensuite par niveau.
const config = async () => {
  const backend = await createJestConfig({
    displayName: "backend",
    testEnvironment: "node",
    testMatch: [
      "<rootDir>/tests/unitaire/backend/**/*.test.{ts,tsx}",
      "<rootDir>/tests/integration/backend/**/*.test.{ts,tsx}",
    ],
  })();

  const frontend = await createJestConfig({
    displayName: "frontend",
    testEnvironment: "jsdom",
    setupFilesAfterEnv: ["<rootDir>/tests/jest.setup.ts"],
    testMatch: [
      "<rootDir>/tests/unitaire/frontend/**/*.test.{ts,tsx}",
      "<rootDir>/tests/integration/frontend/**/*.test.{ts,tsx}",
    ],
  })();

  return { projects: [backend, frontend] };
};

export default config;
