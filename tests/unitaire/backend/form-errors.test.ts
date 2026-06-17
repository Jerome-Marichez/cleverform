import {
  FormDomainError,
  FormNotFoundError,
  InvalidStatusTransitionError,
} from "@/backend/form/formErrors";

// Tests unitaires des erreurs métier de la couche Form. Logique pure (aucun
// mock, aucune dépendance) : on vérifie le typage (instanceof), le `name` et le
// message produits — ce qui permet aux Route Handlers de mapper la cause en code
// HTTP sans inspecter de chaînes.

describe("FormNotFoundError (unitaire)", () => {
  it("hérite de FormDomainError et de Error", () => {
    const error = new FormNotFoundError("form-123");
    expect(error).toBeInstanceOf(FormNotFoundError);
    expect(error).toBeInstanceOf(FormDomainError);
    expect(error).toBeInstanceOf(Error);
  });

  it("expose un `name` égal au nom de la classe", () => {
    expect(new FormNotFoundError("form-123").name).toBe("FormNotFoundError");
  });

  it("inclut l'identifiant introuvable dans le message", () => {
    expect(new FormNotFoundError("form-123").message).toContain("form-123");
  });
});

describe("InvalidStatusTransitionError (unitaire)", () => {
  it("hérite de FormDomainError et de Error", () => {
    const error = new InvalidStatusTransitionError("PUBLISHED", "DRAFT");
    expect(error).toBeInstanceOf(InvalidStatusTransitionError);
    expect(error).toBeInstanceOf(FormDomainError);
    expect(error).toBeInstanceOf(Error);
  });

  it("expose un `name` égal au nom de la classe", () => {
    expect(
      new InvalidStatusTransitionError("PUBLISHED", "DRAFT").name,
    ).toBe("InvalidStatusTransitionError");
  });

  it("mentionne la transition refusée (de → vers) dans le message", () => {
    const message = new InvalidStatusTransitionError(
      "PUBLISHED",
      "DRAFT",
    ).message;
    expect(message).toContain("PUBLISHED");
    expect(message).toContain("DRAFT");
  });
});

describe("FormDomainError (unitaire)", () => {
  it("permet de distinguer une erreur métier d'une erreur technique", () => {
    const domain: Error = new FormNotFoundError("x");
    const technical: Error = new Error("panne réseau");
    expect(domain).toBeInstanceOf(FormDomainError);
    expect(technical).not.toBeInstanceOf(FormDomainError);
  });
});
