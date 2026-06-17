import * as React from "react";
import { render, type RenderOptions } from "@testing-library/react";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { theme } from "@/frontend/theme";

// Helper de rendu pour les tests unitaires frontend : enveloppe le composant
// testé dans le ThemeProvider MUI (+ CssBaseline) du projet. Indispensable pour
// les composants qui consomment le thème (`useTheme`) ou le mode de couleur
// (`useColorScheme`) — sans quoi MUI émet des avertissements de contexte.
function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider theme={theme} defaultMode="light">
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}

// Reproduit la signature de `render` de Testing Library, mais avec le thème.
export function renderWithTheme(
  ui: React.ReactElement,
  options?: Omit<RenderOptions, "wrapper">,
) {
  return render(ui, { wrapper: Wrapper, ...options });
}
