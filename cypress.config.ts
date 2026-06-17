import { defineConfig } from "cypress";

// Outil de test unique : Cypress. Les specs vivent dans tests/ (voir docs/testing.md).
export default defineConfig({
  e2e: {
    baseUrl: "http://localhost:3000",
    specPattern: "tests/**/*.cy.{ts,tsx}",
    supportFile: false,
    fixturesFolder: "tests/fixtures",
  },
});
