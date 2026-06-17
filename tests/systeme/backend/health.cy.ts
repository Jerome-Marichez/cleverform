// Test système (backend) — vérifie la route API de santé via cy.request.
describe("Santé de l'API (système)", () => {
  it("répond OK sur /api/health", () => {
    cy.request("/api/health").its("body.status").should("equal", "ok");
  });
});
