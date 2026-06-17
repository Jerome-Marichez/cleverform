import * as React from "react";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import { renderWithTheme } from "../renderWithTheme";
import { LoginForm } from "@/frontend/components/auth/LoginForm";

// Tests unitaires de LoginForm : rendu, validation du mot de passe requis,
// affichage de l'erreur serveur, redirection au succès et erreur réseau. Le
// router Next (`useRouter`/`useSearchParams`) et `fetch` sont stubés — ce sont
// des FRONTIÈRES (navigation, HTTP) isolées et documentées ; on passe des
// données d'exemple réelles, sans mocker de logique métier.
const replace = jest.fn();
const refresh = jest.fn();
let searchFrom: string | null = null;

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace, refresh }),
  useSearchParams: () => ({ get: () => searchFrom }),
}));

function fillPassword(value: string) {
  fireEvent.change(screen.getByLabelText("Mot de passe"), {
    target: { value },
  });
}

describe("LoginForm (unitaire)", () => {
  beforeEach(() => {
    replace.mockClear();
    refresh.mockClear();
    searchFrom = null;
    global.fetch = jest.fn() as unknown as typeof fetch;
  });

  it("affiche le titre, le champ mot de passe et le bouton de connexion", () => {
    renderWithTheme(<LoginForm />);
    expect(
      screen.getByRole("heading", { name: "Espace administrateur" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Mot de passe")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Se connecter" }),
    ).toBeInTheDocument();
  });

  it("signale le mot de passe requis et n'appelle pas le réseau", async () => {
    renderWithTheme(<LoginForm />);
    fireEvent.click(screen.getByRole("button", { name: "Se connecter" }));
    expect(
      await screen.findByText("Le mot de passe est requis."),
    ).toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("affiche le message d'erreur renvoyé par le serveur", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Mot de passe incorrect." }),
    });
    renderWithTheme(<LoginForm />);
    fillPassword("mauvais");
    fireEvent.click(screen.getByRole("button", { name: "Se connecter" }));

    expect(
      await screen.findByText("Mot de passe incorrect."),
    ).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });

  it("redirige vers /admin au succès (sans cible `from`)", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true });
    renderWithTheme(<LoginForm />);
    fillPassword("bon-mot-de-passe");
    fireEvent.click(screen.getByRole("button", { name: "Se connecter" }));

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/admin"));
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("respecte une cible interne `from` au succès", async () => {
    searchFrom = "/admin/forms/abc/edit";
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true });
    renderWithTheme(<LoginForm />);
    fillPassword("bon-mot-de-passe");
    fireEvent.click(screen.getByRole("button", { name: "Se connecter" }));

    await waitFor(() =>
      expect(replace).toHaveBeenCalledWith("/admin/forms/abc/edit"),
    );
  });

  it("ignore une cible `from` externe (anti open-redirect)", async () => {
    searchFrom = "//evil.example.com";
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true });
    renderWithTheme(<LoginForm />);
    fillPassword("bon-mot-de-passe");
    fireEvent.click(screen.getByRole("button", { name: "Se connecter" }));

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/admin"));
  });

  it("affiche une erreur réseau si `fetch` échoue", async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error("offline"));
    renderWithTheme(<LoginForm />);
    fillPassword("bon-mot-de-passe");
    fireEvent.click(screen.getByRole("button", { name: "Se connecter" }));

    expect(
      await screen.findByText(/erreur réseau est survenue/i),
    ).toBeInTheDocument();
  });
});
