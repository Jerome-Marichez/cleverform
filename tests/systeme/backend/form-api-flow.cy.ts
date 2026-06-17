// Test SYSTÈME (backend) — flux API de bout en bout via HTTP réel (serveur lancé)
// + middleware + Prisma + BDD de test. On enchaîne les vraies routes par
// `cy.request` : connexion admin, création, publication, lecture publique,
// soumission de réponse, lecture des réponses. Aucune donnée mockée.

const password = Cypress.env("ADMIN_PASSWORD");

function login() {
  return cy.request("POST", "/api/auth/login", { password });
}

describe("Flux API questionnaire (système)", () => {
  it("connexion → création → publication → réponse → lecture", () => {
    login().its("status").should("eq", 200);

    cy.request("POST", "/api/admin/forms", {
      title: "Sondage système",
      questions: [
        { label: "Votre prénom ?", type: "SHORT_TEXT", required: true, order: 0 },
      ],
    }).then((created) => {
      expect(created.status).to.eq(201);
      const { id, publicId } = created.body;

      cy.request("PATCH", `/api/admin/forms/${id}/publish`, {
        status: "PUBLISHED",
      })
        .its("status")
        .should("eq", 200);

      // Lecture publique : DTO sans fuite de l'id interne.
      cy.request(`/api/public/forms/${publicId}`).then((pub) => {
        expect(pub.status).to.eq(200);
        expect(pub.body.publicId).to.eq(publicId);
        expect(pub.body.id).to.equal(undefined);
        const questionId = pub.body.questions[0].id;

        cy.request("POST", `/api/public/forms/${publicId}/responses`, {
          answers: [{ questionId, value: "Jean" }],
        })
          .its("status")
          .should("eq", 201);

        cy.request(`/api/admin/forms/${id}/responses`).then((responses) => {
          expect(responses.status).to.eq(200);
          expect(responses.body.responses).to.have.length(1);
        });
      });
    });
  });

  it("refuse l'accès aux routes admin sans session (401)", () => {
    cy.clearCookies();
    cy.request({ url: "/api/admin/forms", failOnStatusCode: false })
      .its("status")
      .should("eq", 401);
  });

  it("renvoie 404 sur un questionnaire public non publié (brouillon)", () => {
    login();
    cy.request("POST", "/api/admin/forms", {
      title: "Brouillon système",
      questions: [
        { label: "Q", type: "SHORT_TEXT", required: false, order: 0 },
      ],
    }).then((created) => {
      cy.request({
        url: `/api/public/forms/${created.body.publicId}`,
        failOnStatusCode: false,
      })
        .its("status")
        .should("eq", 404);
    });
  });
});
