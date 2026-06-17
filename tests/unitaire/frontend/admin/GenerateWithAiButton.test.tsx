import * as React from "react";
import { screen, fireEvent } from "@testing-library/react";
import { renderWithTheme } from "../renderWithTheme";
import { GenerateWithAiButton } from "@/frontend/components/admin/GenerateWithAiButton";

// Tests unitaires de GenerateWithAiButton : libellé (défaut / personnalisé) et
// ouverture de la boîte de dialogue de génération IA. La dialogue ouverte
// consomme `useRouter` (Next) ; on stube cette FRONTIÈRE de façon isolée — on ne
// neutralise que la navigation, aucune donnée métier n'est mockée.
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

describe("GenerateWithAiButton (unitaire)", () => {
  it("affiche le libellé par défaut « Générer par IA »", () => {
    renderWithTheme(<GenerateWithAiButton />);
    expect(
      screen.getByRole("button", { name: "Générer par IA" }),
    ).toBeInTheDocument();
  });

  it("accepte un libellé personnalisé", () => {
    renderWithTheme(<GenerateWithAiButton label="Assistant IA" />);
    expect(
      screen.getByRole("button", { name: "Assistant IA" }),
    ).toBeInTheDocument();
  });

  it("n'affiche pas la boîte de dialogue tant qu'on n'a pas cliqué", () => {
    renderWithTheme(<GenerateWithAiButton />);
    expect(
      screen.queryByRole("heading", {
        name: "Générer un questionnaire par IA",
      }),
    ).not.toBeInTheDocument();
  });

  it("ouvre la boîte de dialogue de génération au clic", () => {
    renderWithTheme(<GenerateWithAiButton />);
    fireEvent.click(screen.getByRole("button", { name: "Générer par IA" }));
    expect(
      screen.getByRole("heading", {
        name: "Générer un questionnaire par IA",
      }),
    ).toBeInTheDocument();
  });
});
