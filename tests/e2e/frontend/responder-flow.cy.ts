// Test E2E (frontend) — parcours RÉPONDANT dans le navigateur. On seed un
// questionnaire publié via l'API (connexion admin + création + publication), puis
// on remplit et soumet le formulaire public et on vérifie l'écran de remerciement.

const password = Cypress.env("ADMIN_PASSWORD");

describe("Parcours répondant (e2e)", () => {
  it("remplit un questionnaire publié et voit l'écran de remerciement", () => {
    cy.request("POST", "/api/auth/login", { password });
    cy.request("POST", "/api/admin/forms", {
      title: "Questionnaire e2e",
      questions: [
        { label: "Votre prénom ?", type: "SHORT_TEXT", required: true, order: 0 },
      ],
    }).then((created) => {
      const { id, publicId } = created.body;
      cy.request("PATCH", `/api/admin/forms/${id}/publish`, {
        status: "PUBLISHED",
      });

      cy.visit(`/f/${publicId}`);
      cy.contains("h1", "Questionnaire e2e");

      // Saisie de la réponse.
      cy.get('form input[type="text"]').first().type("Jean");

      // Consentement RGPD obligatoire avant l'envoi.
      cy.get('input[type="checkbox"]').check();

      cy.contains("button", "Envoyer mes réponses").click();

      // Écran de remerciement (la surface publique est write-only).
      cy.contains("Merci pour votre réponse !").should("be.visible");
    });
  });

  it("bloque l'envoi sans consentement RGPD", () => {
    cy.request("POST", "/api/auth/login", { password });
    cy.request("POST", "/api/admin/forms", {
      title: "Questionnaire consentement",
      questions: [
        { label: "Votre prénom ?", type: "SHORT_TEXT", required: true, order: 0 },
      ],
    }).then((created) => {
      const { id, publicId } = created.body;
      cy.request("PATCH", `/api/admin/forms/${id}/publish`, {
        status: "PUBLISHED",
      });

      cy.visit(`/f/${publicId}`);
      cy.get('form input[type="text"]').first().type("Jean");
      cy.contains("button", "Envoyer mes réponses").click();

      // Sans consentement coché : message bloquant, pas d'écran de remerciement.
      cy.contains("Vous devez accepter le traitement de vos réponses").should(
        "be.visible",
      );
      cy.contains("Merci pour votre réponse !").should("not.exist");
    });
  });
});
