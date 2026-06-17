import { defineConfig } from "cypress";

// Cypress couvre les niveaux e2e (front) et système (back) ; l'unitaire et
// l'intégration sont gérés par Jest (.test.ts). Voir docs/testing.md.
export default defineConfig({
  e2e: {
    baseUrl: "http://localhost:3000",
    specPattern: "tests/{e2e,systeme}/**/*.cy.{ts,tsx}",
    supportFile: false,
    fixturesFolder: "tests/fixtures",
  },
});
