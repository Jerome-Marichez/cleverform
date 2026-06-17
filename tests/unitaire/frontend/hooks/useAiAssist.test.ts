import { renderHook, act, waitFor } from "@testing-library/react";
import { useAiAssist } from "@/frontend/hooks/useAiAssist";

// Tests unitaires de useAiAssist : génération et correction via les routes IA
// admin, gestion de `pending`/`error` et reset. `fetch` est stubé (FRONTIÈRE
// HTTP) avec des réponses d'exemple réalistes ; la clé API et la logique serveur
// ne sont jamais sollicitées (voir docs/security.md).

function jsonResponse(ok: boolean, body: unknown): Response {
  return {
    ok,
    json: async () => body,
  } as unknown as Response;
}

describe("useAiAssist (unitaire)", () => {
  beforeEach(() => {
    global.fetch = jest.fn() as unknown as typeof fetch;
  });

  it("démarre sans chargement ni erreur", () => {
    const { result } = renderHook(() => useAiAssist());
    expect(result.current.pending).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("generate renvoie l'identifiant créé et appelle la bonne route", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      jsonResponse(true, { id: "form-7" }),
    );

    const { result } = renderHook(() => useAiAssist());
    let created: { id: string } | undefined;
    await act(async () => {
      created = await result.current.generate("Soirée sur le thème de l'IA");
    });

    expect(created).toEqual({ id: "form-7" });
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/admin/ai/generate",
      expect.objectContaining({ method: "POST" }),
    );
    expect(result.current.pending).toBe(false);
  });

  it("generate propage l'erreur du serveur et la stocke", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      jsonResponse(false, { error: "Quota IA dépassé." }),
    );

    const { result } = renderHook(() => useAiAssist());
    await act(async () => {
      await expect(result.current.generate("prompt")).rejects.toThrow(
        "Quota IA dépassé.",
      );
    });

    await waitFor(() => expect(result.current.error).toBe("Quota IA dépassé."));
    expect(result.current.pending).toBe(false);
  });

  it("generate utilise un message par défaut si le serveur n'en fournit pas", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(jsonResponse(false, {}));

    const { result } = renderHook(() => useAiAssist());
    await act(async () => {
      await expect(result.current.generate("prompt")).rejects.toThrow(
        "La génération par IA a échoué.",
      );
    });
  });

  it("proofread renvoie le texte corrigé", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      jsonResponse(true, { corrected: "Quel est votre prénom ?" }),
    );

    const { result } = renderHook(() => useAiAssist());
    let corrected: string | undefined;
    await act(async () => {
      corrected = await result.current.proofread("quel est votre prenom");
    });

    expect(corrected).toBe("Quel est votre prénom ?");
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/admin/ai/proofread",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("proofread retombe sur le texte d'origine si aucune correction n'est renvoyée", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(jsonResponse(true, {}));

    const { result } = renderHook(() => useAiAssist());
    let corrected: string | undefined;
    await act(async () => {
      corrected = await result.current.proofread("texte inchangé");
    });

    expect(corrected).toBe("texte inchangé");
  });

  it("resetError efface l'erreur courante", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      jsonResponse(false, { error: "Échec." }),
    );

    const { result } = renderHook(() => useAiAssist());
    await act(async () => {
      await expect(result.current.proofread("x")).rejects.toThrow("Échec.");
    });
    await waitFor(() => expect(result.current.error).toBe("Échec."));

    act(() => result.current.resetError());
    expect(result.current.error).toBeNull();
  });
});
