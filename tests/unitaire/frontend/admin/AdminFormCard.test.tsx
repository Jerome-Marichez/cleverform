import * as React from "react";
import { screen, fireEvent } from "@testing-library/react";
import { renderWithTheme } from "../renderWithTheme";
import { AdminFormCard } from "@/frontend/components/admin/AdminFormCard";

// Tests unitaires de AdminFormCard : rend la carte (titre, description, statut)
// et superpose le menu d'actions, puis navigue vers l'éditeur au clic. Le router
// Next est stubé (FRONTIÈRE de navigation) — on capture `push` pour vérifier la
// cible, sans réseau ni fausse donnée métier.
const push = jest.fn();
const refresh = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh }),
}));

const FORM = {
  id: "form-42",
  publicId: "pub-42",
  title: "Sondage événement IA",
  description: "Quelques questions sur la soirée",
  status: "DRAFT" as const,
  questionCount: 5,
  updatedAt: "2026-06-17T10:00:00.000Z",
};

describe("AdminFormCard (unitaire)", () => {
  beforeEach(() => {
    push.mockClear();
    refresh.mockClear();
  });

  it("affiche le titre et la description du questionnaire", () => {
    renderWithTheme(<AdminFormCard {...FORM} />);
    expect(screen.getByText("Sondage événement IA")).toBeInTheDocument();
    expect(
      screen.getByText("Quelques questions sur la soirée"),
    ).toBeInTheDocument();
  });

  it("expose le menu d'actions du questionnaire", () => {
    renderWithTheme(<AdminFormCard {...FORM} />);
    expect(
      screen.getByRole("button", { name: "Actions du questionnaire" }),
    ).toBeInTheDocument();
  });

  it("navigue vers l'éditeur au clic sur la carte", () => {
    renderWithTheme(<AdminFormCard {...FORM} />);
    fireEvent.click(screen.getByRole("button", { name: /Sondage événement IA/ }));
    expect(push).toHaveBeenCalledWith("/admin/forms/form-42/edit");
  });
});
