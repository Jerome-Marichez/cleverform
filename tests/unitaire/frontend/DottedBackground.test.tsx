import * as React from "react";
import { render } from "@testing-library/react";
import { ThemeProvider } from "@mui/material/styles";
import { theme } from "@/frontend/theme";
import { DottedBackground } from "@/frontend/components/DottedBackground";

// Enveloppe les composants dans le thème de l'application (props réelles, sans
// mock) : DottedBackground lit la palette `secondary` via `useTheme`.
function renderWithTheme(ui: React.ReactElement, mode: "light" | "dark") {
  return render(
    <ThemeProvider theme={theme} defaultMode={mode}>
      {ui}
    </ThemeProvider>,
  );
}

describe("DottedBackground (unitaire)", () => {
  it("affiche le contenu posé au-dessus du motif", () => {
    const { getByText } = renderWithTheme(
      <DottedBackground>
        <p>Contenu</p>
      </DottedBackground>,
      "light",
    );
    expect(getByText("Contenu")).toBeInTheDocument();
  });

  it("expose une couche décorative non lisible par les lecteurs d'écran", () => {
    const { container } = renderWithTheme(
      <DottedBackground>
        <p>Contenu</p>
      </DottedBackground>,
      "light",
    );
    const decorative = container.querySelector('[aria-hidden="true"]');
    expect(decorative).not.toBeNull();
    // La couche décorative ne capte pas les interactions (pointer-events: none).
    expect(decorative).toHaveStyle({ pointerEvents: "none" });
  });

  it("rend une couche en overlay quand aucun enfant n'est fourni", () => {
    const { container } = renderWithTheme(<DottedBackground />, "light");
    const decorative = container.querySelector('[aria-hidden="true"]');
    expect(decorative).not.toBeNull();
  });

  it("fonctionne aussi en mode sombre (theme-aware)", () => {
    const { container } = renderWithTheme(
      <DottedBackground>
        <p>Sombre</p>
      </DottedBackground>,
      "dark",
    );
    expect(container.querySelector('[aria-hidden="true"]')).not.toBeNull();
  });
});
