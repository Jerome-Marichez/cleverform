import {
  publicFormPath,
  buildPublicFormUrl,
} from "@/frontend/lib/publicFormUrl";

// Tests unitaires de la construction de l'URL publique d'un questionnaire.
// Sous jsdom, `window.location.origin` vaut « http://localhost ».

describe("publicFormUrl (unitaire)", () => {
  it("publicFormPath renvoie le chemin relatif /f/<publicId>", () => {
    expect(publicFormPath("abc123")).toBe("/f/abc123");
  });

  it("buildPublicFormUrl préfixe l'origine courante", () => {
    expect(buildPublicFormUrl("abc123")).toBe("http://localhost/f/abc123");
  });

  it("n'expose que le publicId fourni (jamais d'id interne)", () => {
    expect(buildPublicFormUrl("pub-token")).toBe(
      "http://localhost/f/pub-token",
    );
  });
});
