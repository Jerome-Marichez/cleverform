import * as React from "react";
import { render } from "@testing-library/react";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { axe } from "jest-axe";
import { theme } from "@/frontend/theme";
import Home from "@/app/page";

// Tests d'accessibilité automatisés (axe) : on scanne la page d'accueil rendue
// pour détecter les violations a11y courantes (contraste, rôles, libellés,
// hiérarchie…). Aucune violation ne doit être remontée, en thème clair comme
// sombre. Sans mock : on rend les composants réels sous le ThemeProvider.
function renderHome(mode: "light" | "dark") {
  return render(
    <ThemeProvider theme={theme} defaultMode={mode}>
      <CssBaseline />
      <Home />
    </ThemeProvider>,
  );
}

describe("Accessibilité — page d'accueil (axe)", () => {
  it("ne présente aucune violation en thème clair", async () => {
    const { container } = renderHome("light");
    expect(await axe(container)).toHaveNoViolations();
  });

  it("ne présente aucune violation en thème sombre", async () => {
    const { container } = renderHome("dark");
    expect(await axe(container)).toHaveNoViolations();
  });
});
