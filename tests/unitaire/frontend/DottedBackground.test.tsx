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

  it("révèle la couche halo interactive par défaut (pas de réduction de mouvement)", () => {
    const { container } = renderWithTheme(<DottedBackground />, "light");
    expect(
      container.querySelector('[data-dotted-layer="base"]'),
    ).not.toBeNull();
    expect(
      container.querySelector('[data-dotted-layer="halo"]'),
    ).not.toBeNull();
  });

  it("n'ajoute pas la couche halo quand interactive est désactivé", () => {
    const { container } = renderWithTheme(
      <DottedBackground interactive={false} />,
      "light",
    );
    expect(
      container.querySelector('[data-dotted-layer="base"]'),
    ).not.toBeNull();
    expect(container.querySelector('[data-dotted-layer="halo"]')).toBeNull();
  });

  it("retombe sur le motif statique si prefers-reduced-motion est actif", () => {
    // On force la préférence « réduire les animations » au niveau de matchMedia.
    const original = window.matchMedia;
    window.matchMedia = (query: string): MediaQueryList =>
      ({
        matches: query.includes("prefers-reduced-motion"),
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }) as MediaQueryList;

    try {
      const { container } = renderWithTheme(<DottedBackground />, "light");
      expect(
        container.querySelector('[data-dotted-layer="base"]'),
      ).not.toBeNull();
      expect(container.querySelector('[data-dotted-layer="halo"]')).toBeNull();
    } finally {
      window.matchMedia = original;
    }
  });
});
