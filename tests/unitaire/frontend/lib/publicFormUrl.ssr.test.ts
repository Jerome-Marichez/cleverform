/**
 * @jest-environment node
 */
import { buildPublicFormUrl } from "@/frontend/lib/publicFormUrl";

// Couvre la branche **SSR** de `buildPublicFormUrl` : en environnement `node`,
// `window` est réellement indisponible (pas de simulation ni de mock). La
// fonction doit alors renvoyer le chemin relatif, sans tenter de préfixer une
// origine.

describe("buildPublicFormUrl — rendu serveur (sans window)", () => {
  it("retombe sur le chemin relatif quand `window` est indisponible", () => {
    expect(typeof window).toBe("undefined");
    expect(buildPublicFormUrl("abc123")).toBe("/f/abc123");
  });
});
