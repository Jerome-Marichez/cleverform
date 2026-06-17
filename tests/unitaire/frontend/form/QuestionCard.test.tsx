import * as React from "react";
import { screen } from "@testing-library/react";
import { renderWithTheme } from "../renderWithTheme";
import { QuestionCard } from "@/frontend/components/form/QuestionCard";

// Tests unitaires de QuestionCard : libellé, type (nom lisible), numéro d'ordre
// et badge « Obligatoire ».

describe("QuestionCard (unitaire)", () => {
  it("affiche le libellé de la question", () => {
    renderWithTheme(<QuestionCard label="Votre âge ?" type="NUMBER" />);
    expect(screen.getByText("Votre âge ?")).toBeInTheDocument();
  });

  it("affiche le nom lisible du type (NUMBER → Nombre)", () => {
    renderWithTheme(<QuestionCard label="x" type="NUMBER" />);
    expect(screen.getByText("Nombre")).toBeInTheDocument();
  });

  it("affiche le numéro d'ordre quand index est fourni", () => {
    renderWithTheme(<QuestionCard label="x" type="SHORT_TEXT" index={2} />);
    expect(screen.getByText("2.")).toBeInTheDocument();
  });

  it("n'affiche pas de numéro sans index", () => {
    renderWithTheme(<QuestionCard label="x" type="SHORT_TEXT" />);
    expect(screen.queryByText("1.")).not.toBeInTheDocument();
  });

  it("affiche le badge « Obligatoire » quand required", () => {
    renderWithTheme(<QuestionCard label="x" type="SHORT_TEXT" required />);
    expect(screen.getByText("Obligatoire")).toBeInTheDocument();
  });

  it("n'affiche pas le badge quand le champ est facultatif", () => {
    renderWithTheme(<QuestionCard label="x" type="SHORT_TEXT" />);
    expect(screen.queryByText("Obligatoire")).not.toBeInTheDocument();
  });
});
