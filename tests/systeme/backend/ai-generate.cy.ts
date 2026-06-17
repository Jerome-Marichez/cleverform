// Test SYSTÈME (backend) — chemin NOMINAL de l'assistance IA, via un appel RÉEL à
// Anthropic (Haiku 4.5) à travers le serveur. On vérifie le bout en bout :
// session admin → route IA → SDK Anthropic → mapping/validation → persistance.
//
// L'IA étant non déterministe, les assertions sont **structurelles** (statut,
// forme du questionnaire) — jamais le contenu exact — pour rester stables. Si la
// clé `ANTHROPIC_API_KEY` est absente (503), le test est ignoré proprement plutôt
// que de faire échouer la CI (pas de masquage de régression : on n'exerce alors
// simplement pas le chemin externe).

const password = Cypress.env("ADMIN_PASSWORD");

const ALLOWED_TYPES = [
  "SHORT_TEXT",
  "LONG_TEXT",
  "SINGLE_CHOICE",
  "MULTIPLE_CHOICE",
  "RATING",
  "NUMBER",
  "EMAIL",
  "DATE",
];

// Les appels IA réels prennent quelques secondes : on élargit le timeout.
const AI_TIMEOUT = 60000;

describe("Assistance IA — chemin nominal (système)", () => {
  beforeEach(() => {
    cy.request("POST", "/api/auth/login", { password });
  });

  it("génère et persiste un questionnaire à partir d'un prompt", function () {
    cy.request({
      method: "POST",
      url: "/api/admin/ai/generate",
      body: {
        prompt:
          "Un court questionnaire de satisfaction pour une soirée sur le thème de l'IA",
      },
      timeout: AI_TIMEOUT,
      failOnStatusCode: false,
    }).then((response) => {
      if (response.status === 503) {
        // Clé ANTHROPIC_API_KEY absente : assistance IA indisponible → on ignore.
        this.skip();
      }

      expect(response.status).to.eq(201);
      expect(response.body.id).to.be.a("string");
      expect(response.body.title).to.be.a("string");
      expect(response.body.title.length).to.be.greaterThan(0);
      expect(response.body.generatedByAi).to.eq(true);

      const questions = response.body.questions;
      expect(questions).to.be.an("array");
      expect(questions.length).to.be.greaterThan(0);
      questions.forEach((question: { label: string; type: string }) => {
        expect(question.label.length).to.be.greaterThan(0);
        expect(ALLOWED_TYPES).to.include(question.type);
      });
    });
  });

  it("corrige l'orthographe d'un texte via l'IA", function () {
    cy.request({
      method: "POST",
      url: "/api/admin/ai/proofread",
      body: { text: "je voudré un kestionaire pour mon évenement de se soir" },
      timeout: AI_TIMEOUT,
      failOnStatusCode: false,
    }).then((response) => {
      if (response.status === 503) {
        this.skip();
      }

      expect(response.status).to.eq(200);
      expect(response.body.corrected).to.be.a("string");
      expect(response.body.corrected.length).to.be.greaterThan(0);
    });
  });
});
