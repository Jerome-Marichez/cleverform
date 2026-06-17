import { renderHook, act, waitFor } from "@testing-library/react";
import { useFormMutations } from "@/frontend/hooks/useFormMutations";

// Tests unitaires de useFormMutations : création, changement de statut et
// suppression d'un questionnaire, avec gestion homogène de `pending`/`error`.
// `fetch` est stubé (FRONTIÈRE HTTP) avec des réponses d'exemple réalistes ;
// aucune logique métier ni Prisma n'est mockée.

function jsonResponse(ok: boolean, body: unknown, status = ok ? 200 : 400): Response {
  return {
    ok,
    status,
    json: async () => body,
  } as unknown as Response;
}

describe("useFormMutations (unitaire)", () => {
  beforeEach(() => {
    global.fetch = jest.fn() as unknown as typeof fetch;
  });

  it("démarre sans chargement ni erreur", () => {
    const { result } = renderHook(() => useFormMutations());
    expect(result.current.pending).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("createForm poste vers /api/admin/forms et renvoie l'identifiant", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      jsonResponse(true, { id: "form-9" }),
    );

    const { result } = renderHook(() => useFormMutations());
    let created: { id: string } | undefined;
    await act(async () => {
      created = await result.current.createForm({ title: "Mon sondage" });
    });

    expect(created).toEqual({ id: "form-9" });
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/admin/forms",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("createForm inclut la description quand elle est fournie", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      jsonResponse(true, { id: "form-10" }),
    );

    const { result } = renderHook(() => useFormMutations());
    await act(async () => {
      await result.current.createForm({
        title: "Avec description",
        description: "Un contexte",
      });
    });

    const [, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(JSON.parse(init.body as string)).toMatchObject({
      title: "Avec description",
      description: "Un contexte",
    });
  });

  it("createForm propage l'erreur serveur et la stocke", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      jsonResponse(false, { error: "Titre déjà utilisé." }),
    );

    const { result } = renderHook(() => useFormMutations());
    await act(async () => {
      await expect(
        result.current.createForm({ title: "x" }),
      ).rejects.toThrow("Titre déjà utilisé.");
    });

    await waitFor(() => expect(result.current.error).toBe("Titre déjà utilisé."));
    expect(result.current.pending).toBe(false);
  });

  it("changeStatus appelle la route de publication avec le statut", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(jsonResponse(true, {}));

    const { result } = renderHook(() => useFormMutations());
    await act(async () => {
      await result.current.changeStatus("form-3", "PUBLISHED");
    });

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/admin/forms/form-3/publish",
      expect.objectContaining({ method: "PATCH" }),
    );
  });

  it("changeStatus utilise un message par défaut si le serveur n'en fournit pas", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(jsonResponse(false, {}));

    const { result } = renderHook(() => useFormMutations());
    await act(async () => {
      await expect(
        result.current.changeStatus("form-3", "CLOSED"),
      ).rejects.toThrow("Changement de statut impossible.");
    });
  });

  it("deleteForm envoie un DELETE sans tenter de parser un corps vide", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 204,
    } as unknown as Response);

    const { result } = renderHook(() => useFormMutations());
    await act(async () => {
      await result.current.deleteForm("form-5");
    });

    expect(global.fetch).toHaveBeenCalledWith("/api/admin/forms/form-5", {
      method: "DELETE",
    });
  });

  it("deleteForm propage l'erreur serveur", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      jsonResponse(false, { error: "Suppression refusée." }),
    );

    const { result } = renderHook(() => useFormMutations());
    await act(async () => {
      await expect(result.current.deleteForm("form-5")).rejects.toThrow(
        "Suppression refusée.",
      );
    });
    await waitFor(() =>
      expect(result.current.error).toBe("Suppression refusée."),
    );
  });

  it("resetError efface l'erreur courante", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      jsonResponse(false, { error: "Échec." }),
    );

    const { result } = renderHook(() => useFormMutations());
    await act(async () => {
      await expect(result.current.deleteForm("x")).rejects.toThrow("Échec.");
    });
    await waitFor(() => expect(result.current.error).toBe("Échec."));

    act(() => result.current.resetError());
    expect(result.current.error).toBeNull();
  });
});
