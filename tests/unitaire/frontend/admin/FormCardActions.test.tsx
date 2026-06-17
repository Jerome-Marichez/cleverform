import * as React from "react";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import { renderWithTheme } from "../renderWithTheme";
import { FormCardActions } from "@/frontend/components/admin/FormCardActions";

// Tests unitaires de FormCardActions : ouverture du menu, actions disponibles
// selon le statut et confirmation de suppression. Les appels réseau sont stubés
// (pas de DB ni d'HTTP réel) : on teste le COMPORTEMENT de présentation.

const refresh = jest.fn();
const push = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ refresh, push }),
}));

function openMenu() {
  fireEvent.click(
    screen.getByRole("button", { name: "Actions du questionnaire" }),
  );
}

describe("FormCardActions (unitaire)", () => {
  beforeEach(() => {
    refresh.mockClear();
    push.mockClear();
    global.fetch = jest.fn() as unknown as typeof fetch;
  });

  it("affiche le bouton d'ouverture du menu", () => {
    renderWithTheme(
      <FormCardActions id="f1" title="Test" status="DRAFT" />,
    );
    expect(
      screen.getByRole("button", { name: "Actions du questionnaire" }),
    ).toBeInTheDocument();
  });

  it("propose « Publier » pour un brouillon (DRAFT)", () => {
    renderWithTheme(
      <FormCardActions id="f1" title="Test" status="DRAFT" />,
    );
    openMenu();
    expect(
      screen.getByRole("menuitem", { name: /Publier/ }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("menuitem", { name: /Clôturer/ }),
    ).not.toBeInTheDocument();
  });

  it("propose « Clôturer » pour un questionnaire publié (PUBLISHED)", () => {
    renderWithTheme(
      <FormCardActions id="f1" title="Test" status="PUBLISHED" />,
    );
    openMenu();
    expect(
      screen.getByRole("menuitem", { name: /Clôturer/ }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("menuitem", { name: /Publier/ }),
    ).not.toBeInTheDocument();
  });

  it("ne propose pas « Voir les réponses » pour un brouillon (DRAFT)", () => {
    renderWithTheme(<FormCardActions id="f1" title="Test" status="DRAFT" />);
    openMenu();
    expect(
      screen.queryByRole("menuitem", { name: /Voir les réponses/ }),
    ).not.toBeInTheDocument();
  });

  it("navigue vers les réponses depuis un questionnaire publié", () => {
    renderWithTheme(<FormCardActions id="f1" title="Test" status="PUBLISHED" />);
    openMenu();
    fireEvent.click(
      screen.getByRole("menuitem", { name: /Voir les réponses/ }),
    );
    expect(push).toHaveBeenCalledWith("/admin/forms/f1/responses");
  });

  it("propose « Voir les réponses » pour un questionnaire clôturé (CLOSED)", () => {
    renderWithTheme(<FormCardActions id="f1" title="Test" status="CLOSED" />);
    openMenu();
    expect(
      screen.getByRole("menuitem", { name: /Voir les réponses/ }),
    ).toBeInTheDocument();
  });

  it("ne propose ni publier ni clôturer pour un questionnaire clôturé (CLOSED)", () => {
    renderWithTheme(
      <FormCardActions id="f1" title="Test" status="CLOSED" />,
    );
    openMenu();
    expect(
      screen.queryByRole("menuitem", { name: /Publier/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("menuitem", { name: /Clôturer/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("menuitem", { name: /Supprimer/ }),
    ).toBeInTheDocument();
  });

  it("propose toujours la suppression", () => {
    renderWithTheme(
      <FormCardActions id="f1" title="Test" status="DRAFT" />,
    );
    openMenu();
    expect(
      screen.getByRole("menuitem", { name: /Supprimer/ }),
    ).toBeInTheDocument();
  });

  it("demande une confirmation avant de supprimer", async () => {
    renderWithTheme(
      <FormCardActions id="f1" title="Mon questionnaire" status="DRAFT" />,
    );
    openMenu();
    fireEvent.click(screen.getByRole("menuitem", { name: /Supprimer/ }));

    expect(
      await screen.findByRole("heading", {
        name: "Supprimer le questionnaire ?",
      }),
    ).toBeInTheDocument();
    // Le titre du questionnaire est rappelé dans la confirmation.
    expect(
      screen.getByText(/Mon questionnaire/),
    ).toBeInTheDocument();
    // Aucune suppression tant que l'utilisateur n'a pas confirmé.
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("annule la suppression sans appel réseau", async () => {
    renderWithTheme(
      <FormCardActions id="f1" title="Test" status="DRAFT" />,
    );
    openMenu();
    fireEvent.click(screen.getByRole("menuitem", { name: /Supprimer/ }));

    const dialog = await screen.findByRole("dialog");
    fireEvent.click(
      screen.getByRole("button", { name: "Annuler" }),
    );

    await waitFor(() => expect(dialog).not.toBeVisible());
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("envoie la suppression après confirmation", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true });

    renderWithTheme(
      <FormCardActions id="f1" title="Test" status="DRAFT" />,
    );
    openMenu();
    fireEvent.click(screen.getByRole("menuitem", { name: /Supprimer/ }));

    await screen.findByRole("heading", {
      name: "Supprimer le questionnaire ?",
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Supprimer" }),
    );

    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/admin/forms/f1",
        expect.objectContaining({ method: "DELETE" }),
      ),
    );
  });
});
