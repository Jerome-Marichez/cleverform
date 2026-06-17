// Test e2e (frontend) — parcours navigateur sur la page d'accueil.
describe("Page d'accueil (e2e)", () => {
  it("affiche le titre CleverForm", () => {
    cy.visit("/");
    cy.contains("h1", "CleverForm");
  });
});
