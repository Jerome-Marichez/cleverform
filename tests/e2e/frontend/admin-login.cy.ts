// Test E2E (frontend) — parcours de CONNEXION administrateur dans le navigateur :
// page de login → saisie du mot de passe → accès au tableau de bord.

const password = Cypress.env("ADMIN_PASSWORD");

describe("Connexion administrateur (e2e)", () => {
  it("se connecte et atteint le tableau de bord", () => {
    cy.visit("/login");
    cy.contains("h1", "Espace administrateur");

    cy.get('input[type="password"]').type(password, { log: false });
    cy.contains("button", "Se connecter").click();

    cy.url().should("include", "/admin");
    cy.contains("h1", "Questionnaires");
  });

  it("refuse un mauvais mot de passe et reste sur le login", () => {
    cy.visit("/login");
    cy.get('input[type="password"]').type("mauvais-mot-de-passe", { log: false });
    cy.contains("button", "Se connecter").click();

    cy.contains("Mot de passe incorrect.").should("be.visible");
    cy.url().should("include", "/login");
  });

  it("redirige une page admin protégée vers le login", () => {
    cy.clearCookies();
    cy.visit("/admin");
    cy.url().should("include", "/login");
  });
});
