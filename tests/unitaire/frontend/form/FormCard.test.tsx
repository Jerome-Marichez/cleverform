import * as React from "react";
import { screen, fireEvent } from "@testing-library/react";
import { renderWithTheme } from "../renderWithTheme";
import { FormCard } from "@/frontend/components/form/FormCard";

// Tests unitaires de FormCard : titre, description, compteur de questions,
// statut (via FormStatusChip) et clic.

describe("FormCard (unitaire)", () => {
  const base = {
    title: "Mon questionnaire",
    status: "PUBLISHED" as const,
    questionCount: 3,
    updatedAt: "2026-06-17T10:00:00.000Z",
  };

  it("affiche le titre", () => {
    renderWithTheme(<FormCard {...base} />);
    expect(screen.getByText("Mon questionnaire")).toBeInTheDocument();
  });

  it("affiche la description quand elle est fournie", () => {
    renderWithTheme(<FormCard {...base} description="Une description" />);
    expect(screen.getByText("Une description")).toBeInTheDocument();
  });

  it("n'affiche pas de description quand elle est absente ou nulle", () => {
    renderWithTheme(<FormCard {...base} description={null} />);
    expect(screen.queryByText("Une description")).not.toBeInTheDocument();
  });

  it("affiche le compteur au pluriel", () => {
    renderWithTheme(<FormCard {...base} questionCount={3} />);
    expect(screen.getByText("3 questions")).toBeInTheDocument();
  });

  it("affiche le compteur au singulier pour une seule question", () => {
    renderWithTheme(<FormCard {...base} questionCount={1} />);
    expect(screen.getByText("1 question")).toBeInTheDocument();
  });

  it("affiche le statut via la puce (PUBLISHED → Publié)", () => {
    renderWithTheme(<FormCard {...base} status="PUBLISHED" />);
    expect(screen.getByText("Publié")).toBeInTheDocument();
  });

  it("rend une zone cliquable et déclenche onClick", () => {
    const onClick = jest.fn();
    renderWithTheme(<FormCard {...base} onClick={onClick} />);
    fireEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("n'est pas cliquable sans onClick", () => {
    renderWithTheme(<FormCard {...base} />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("accepte une date sous forme d'objet Date", () => {
    renderWithTheme(
      <FormCard {...base} updatedAt={new Date("2026-06-17T10:00:00.000Z")} />,
    );
    expect(screen.getByText(/Modifié le/)).toBeInTheDocument();
  });
});
