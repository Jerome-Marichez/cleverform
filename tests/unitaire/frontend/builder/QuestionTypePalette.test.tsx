import * as React from "react";
import { screen, fireEvent } from "@testing-library/react";
import { renderWithTheme } from "../renderWithTheme";
import { QuestionTypePalette } from "@/frontend/components/builder/QuestionTypePalette";

// Tests unitaires de QuestionTypePalette : rendu des 8 types et déclenchement de
// l'ajout au clic. Aucun drag&drop ni réseau.

describe("QuestionTypePalette (unitaire)", () => {
  it("affiche un bouton pour chacun des 8 types", () => {
    renderWithTheme(<QuestionTypePalette onAddQuestion={() => {}} />);
    [
      "Texte court",
      "Texte long",
      "Choix unique",
      "Choix multiple",
      "Note",
      "Nombre",
      "E-mail",
      "Date",
    ].forEach((label) =>
      expect(screen.getByRole("button", { name: label })).toBeInTheDocument(),
    );
  });

  it("appelle onAddQuestion avec le type cliqué", () => {
    const onAddQuestion = jest.fn();
    renderWithTheme(<QuestionTypePalette onAddQuestion={onAddQuestion} />);
    fireEvent.click(screen.getByRole("button", { name: "Choix unique" }));
    expect(onAddQuestion).toHaveBeenCalledWith("SINGLE_CHOICE");
  });

  it("désactive les boutons quand disabled", () => {
    renderWithTheme(<QuestionTypePalette onAddQuestion={() => {}} disabled />);
    expect(screen.getByRole("button", { name: "Nombre" })).toBeDisabled();
  });
});
