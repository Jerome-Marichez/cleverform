import * as React from "react";
import { screen, fireEvent } from "@testing-library/react";
import { renderWithTheme } from "../renderWithTheme";
import { NewFormButton } from "@/frontend/components/admin/NewFormButton";

// Tests unitaires de NewFormButton : libellé (défaut / personnalisé) et ouverture
// de la boîte de dialogue de création. La dialogue ouverte consomme `useRouter`
// (Next) ; on stube cette FRONTIÈRE de façon isolée — aucune fausse donnée métier
// n'est mockée, on ne neutralise que la navigation.
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

describe("NewFormButton (unitaire)", () => {
  it("affiche le libellé par défaut « Nouveau questionnaire »", () => {
    renderWithTheme(<NewFormButton />);
    expect(
      screen.getByRole("button", { name: "Nouveau questionnaire" }),
    ).toBeInTheDocument();
  });

  it("accepte un libellé personnalisé", () => {
    renderWithTheme(<NewFormButton label="Créer un formulaire" />);
    expect(
      screen.getByRole("button", { name: "Créer un formulaire" }),
    ).toBeInTheDocument();
  });

  it("n'affiche pas la boîte de dialogue tant qu'on n'a pas cliqué", () => {
    renderWithTheme(<NewFormButton />);
    expect(
      screen.queryByRole("heading", { name: "Nouveau questionnaire" }),
    ).not.toBeInTheDocument();
  });

  it("ouvre la boîte de dialogue de création au clic", () => {
    renderWithTheme(<NewFormButton />);
    fireEvent.click(
      screen.getByRole("button", { name: "Nouveau questionnaire" }),
    );
    expect(
      screen.getByRole("heading", { name: "Nouveau questionnaire" }),
    ).toBeInTheDocument();
  });
});
