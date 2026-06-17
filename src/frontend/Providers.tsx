"use client";

import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { theme } from "@/frontend/theme";

// Fournit le thème MUI (clair / sombre) à toute l'application (couche présentation).
//
// `defaultMode="system"` : au premier chargement, le mode suit la **préférence
// système** de l'utilisateur (`prefers-color-scheme`). Il peut ensuite être
// basculé manuellement (voir ColorModeToggle) ; le choix est mémorisé.
// L'anti-FOUC SSR est assuré par `InitColorSchemeScript` dans le layout.
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider theme={theme} defaultMode="system">
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}
