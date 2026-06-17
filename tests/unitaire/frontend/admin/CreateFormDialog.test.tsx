import * as React from "react";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import { renderWithTheme } from "../renderWithTheme";
import { CreateFormDialog } from "@/frontend/components/admin/CreateFormDialog";

// Tests unitaires de CreateFormDialog : rendu, validation du titre requis et
// fermeture. L'appel réseau (`fetch`) est stubé : on vérifie le COMPORTEMENT de
// présentation (validation, état), pas l'intégration HTTP réelle.

const push = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

describe("CreateFormDialog (unitaire)", () => {
  beforeEach(() => {
    push.mockClear();
    // `fetch` n'est pas censé être appelé tant que la validation échoue ; on le
    // stube par sécurité pour ne jamais toucher le réseau.
    global.fetch = jest.fn() as unknown as typeof fetch;
  });

  it("affiche le titre de la boîte de dialogue quand elle est ouverte", () => {
    renderWithTheme(<CreateFormDialog open onClose={() => {}} />);
    expect(
      screen.getByRole("heading", { name: "Nouveau questionnaire" }),
    ).toBeInTheDocument();
  });

  it("n'affiche rien quand elle est fermée", () => {
    renderWithTheme(<CreateFormDialog open={false} onClose={() => {}} />);
    expect(
      screen.queryByRole("heading", { name: "Nouveau questionnaire" }),
    ).not.toBeInTheDocument();
  });

  it("expose un champ Titre et un champ Description", () => {
    renderWithTheme(<CreateFormDialog open onClose={() => {}} />);
    expect(screen.getByLabelText(/Titre/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Description/)).toBeInTheDocument();
  });

  it("signale l'erreur de titre requis après interaction (blur) sans appel réseau", async () => {
    renderWithTheme(<CreateFormDialog open onClose={() => {}} />);

    // Le bouton « Créer » est désactivé tant que le titre est vide : on déclenche
    // donc la validation via la perte de focus du champ (blur).
    fireEvent.blur(screen.getByLabelText(/Titre/));

    expect(
      await screen.findByText("Le titre du questionnaire est requis."),
    ).toBeInTheDocument();
    // Aucun appel réseau ni navigation tant que le titre reste vide.
    expect(global.fetch).not.toHaveBeenCalled();
    expect(push).not.toHaveBeenCalled();
  });

  it("désactive le bouton Créer tant que le titre est vide", () => {
    renderWithTheme(<CreateFormDialog open onClose={() => {}} />);
    expect(screen.getByRole("button", { name: "Créer" })).toBeDisabled();
  });

  it("active le bouton Créer dès qu'un titre est saisi", () => {
    renderWithTheme(<CreateFormDialog open onClose={() => {}} />);
    fireEvent.change(screen.getByLabelText(/Titre/), {
      target: { value: "Mon questionnaire" },
    });
    expect(screen.getByRole("button", { name: "Créer" })).toBeEnabled();
  });

  it("déclenche onClose au clic sur Annuler", () => {
    const onClose = jest.fn();
    renderWithTheme(<CreateFormDialog open onClose={onClose} />);
    fireEvent.click(screen.getByRole("button", { name: "Annuler" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("soumet un titre valide sans erreur de validation", async () => {
    // Réponse réseau simulée (création réussie) : on vérifie qu'aucune erreur de
    // validation n'apparaît et que le champ a bien été pris en compte.
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ id: "form-1" }),
    });

    renderWithTheme(<CreateFormDialog open onClose={() => {}} />);
    fireEvent.change(screen.getByLabelText(/Titre/), {
      target: { value: "Événement IA" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Créer" }));

    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));
    expect(
      screen.queryByText("Le titre du questionnaire est requis."),
    ).not.toBeInTheDocument();
  });
});
