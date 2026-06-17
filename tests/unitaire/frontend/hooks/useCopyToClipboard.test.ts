import { renderHook, act } from "@testing-library/react";
import { useCopyToClipboard } from "@/frontend/hooks/useCopyToClipboard";

// Tests unitaires de useCopyToClipboard : succès via `navigator.clipboard`, repli
// `document.execCommand` si l'API moderne échoue, et échec global. On stube les
// FRONTIÈRES navigateur (presse-papier, execCommand) — non disponibles sous jsdom
// — de façon isolée ; aucune logique métier n'est mockée.

function setClipboard(writeText: ((text: string) => Promise<void>) | undefined) {
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: writeText ? { writeText } : undefined,
  });
}

describe("useCopyToClipboard (unitaire)", () => {
  afterEach(() => {
    setClipboard(undefined);
    // @ts-expect-error nettoyage du stub de frontière
    delete document.execCommand;
  });

  it("copie via navigator.clipboard et renvoie true", async () => {
    const writeText = jest.fn().mockResolvedValue(undefined);
    setClipboard(writeText);

    const { result } = renderHook(() => useCopyToClipboard());
    let ok: boolean | undefined;
    await act(async () => {
      ok = await result.current.copy("https://exemple.test/f/pub-1");
    });

    expect(ok).toBe(true);
    expect(writeText).toHaveBeenCalledWith("https://exemple.test/f/pub-1");
  });

  it("retombe sur execCommand si navigator.clipboard échoue", async () => {
    setClipboard(jest.fn().mockRejectedValue(new Error("refusé")));
    const execCommand = jest.fn().mockReturnValue(true);
    // @ts-expect-error execCommand n'est pas typé sur Document sous jsdom
    document.execCommand = execCommand;

    const { result } = renderHook(() => useCopyToClipboard());
    let ok: boolean | undefined;
    await act(async () => {
      ok = await result.current.copy("texte de repli");
    });

    expect(ok).toBe(true);
    expect(execCommand).toHaveBeenCalledWith("copy");
  });

  it("renvoie false si aucune méthode de copie n'aboutit", async () => {
    setClipboard(undefined);
    const execCommand = jest.fn().mockReturnValue(false);
    // @ts-expect-error execCommand n'est pas typé sur Document sous jsdom
    document.execCommand = execCommand;

    const { result } = renderHook(() => useCopyToClipboard());
    let ok: boolean | undefined;
    await act(async () => {
      ok = await result.current.copy("échec");
    });

    expect(ok).toBe(false);
  });

  it("expose une fonction `copy` stable entre les rendus", () => {
    const { result, rerender } = renderHook(() => useCopyToClipboard());
    const first = result.current.copy;
    rerender();
    expect(result.current.copy).toBe(first);
  });
});
