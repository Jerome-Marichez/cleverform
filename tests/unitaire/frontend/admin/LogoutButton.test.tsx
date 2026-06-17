import * as React from "react";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import { renderWithTheme } from "../renderWithTheme";
import { LogoutButton } from "@/frontend/components/admin/LogoutButton";

// Tests unitaires de LogoutButton : appel de déconnexion puis redirection vers
// l'accueil public. L'appel réseau et le routeur sont stubés (présentation).

const replace = jest.fn();
const refresh = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace, refresh }),
}));

describe("LogoutButton (unitaire)", () => {
  beforeEach(() => {
    replace.mockClear();
    refresh.mockClear();
    global.fetch = jest.fn().mockResolvedValue({ ok: true }) as unknown as typeof fetch;
  });

  it("affiche le bouton de déconnexion", () => {
    renderWithTheme(<LogoutButton />);
    expect(
      screen.getByRole("button", { name: /Déconnexion/ }),
    ).toBeInTheDocument();
  });

  it("appelle la route de déconnexion puis redirige vers l'accueil public", async () => {
    renderWithTheme(<LogoutButton />);
    fireEvent.click(screen.getByRole("button", { name: /Déconnexion/ }));

    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/auth/logout",
        expect.objectContaining({ method: "POST" }),
      ),
    );
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/"));
    expect(refresh).toHaveBeenCalled();
  });

  it("redirige vers l'accueil même si la requête échoue (idempotence)", async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error("réseau"));

    renderWithTheme(<LogoutButton />);
    fireEvent.click(screen.getByRole("button", { name: /Déconnexion/ }));

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/"));
  });
});
