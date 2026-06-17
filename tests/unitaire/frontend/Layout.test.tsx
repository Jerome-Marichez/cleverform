import * as React from "react";
import { screen } from "@testing-library/react";
import Button from "@mui/material/Button";
import { renderWithTheme } from "./renderWithTheme";
import { AppHeader } from "@/frontend/components/AppHeader";
import { Logo } from "@/frontend/components/Logo";
import { ColorModeToggle } from "@/frontend/components/ColorModeToggle";
import { PageContainer } from "@/frontend/components/PageContainer";

// Tests unitaires des composants de mise en page et de marque.

describe("Logo (unitaire)", () => {
  it("expose la marque CleverForm comme image accessible", () => {
    renderWithTheme(<Logo />);
    expect(screen.getByRole("img", { name: "CleverForm" })).toBeInTheDocument();
  });

  it("variante full : affiche le nom (Clever + Form)", () => {
    renderWithTheme(<Logo variant="full" />);
    expect(screen.getByText("Clever")).toBeInTheDocument();
    expect(screen.getByText("Form")).toBeInTheDocument();
  });

  it("variante mark : n'affiche pas le texte du nom", () => {
    renderWithTheme(<Logo variant="mark" />);
    expect(screen.queryByText("Clever")).not.toBeInTheDocument();
    expect(screen.getByRole("img", { name: "CleverForm" })).toBeInTheDocument();
  });
});

describe("ColorModeToggle (unitaire)", () => {
  it("rend un bouton de bascule de thème sous le provider", () => {
    renderWithTheme(<ColorModeToggle />);
    // Sous le ThemeProvider, le composant est monté ; le bouton expose un
    // libellé accessible (état initial ou cycle de thème).
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("le bouton porte un libellé accessible lié au thème", () => {
    renderWithTheme(<ColorModeToggle />);
    expect(
      screen.getByRole("button").getAttribute("aria-label"),
    ).toMatch(/Thème|Basculer le thème/);
  });
});

describe("AppHeader (unitaire)", () => {
  it("affiche la marque (logo)", () => {
    renderWithTheme(<AppHeader />);
    expect(screen.getByRole("img", { name: "CleverForm" })).toBeInTheDocument();
  });

  it("rend les actions optionnelles quand elles sont fournies", () => {
    renderWithTheme(<AppHeader actions={<Button>Nouveau</Button>} />);
    expect(screen.getByRole("button", { name: "Nouveau" })).toBeInTheDocument();
  });

  it("inclut la bascule de thème", () => {
    renderWithTheme(<AppHeader />);
    // Sans action fournie, le seul bouton est la bascule de thème.
    expect(screen.getByRole("button")).toBeInTheDocument();
  });
});

describe("PageContainer (unitaire)", () => {
  it("rend ses enfants", () => {
    renderWithTheme(
      <PageContainer>
        <p>Contenu de la page</p>
      </PageContainer>,
    );
    expect(screen.getByText("Contenu de la page")).toBeInTheDocument();
  });
});
