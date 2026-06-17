"use client";

import * as React from "react";
import NextLink from "next/link";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Box from "@mui/material/Box";
import { Logo } from "./Logo";
import { ColorModeToggle } from "./ColorModeToggle";

export interface AppHeaderProps {
  /** Actions affichées à droite (avant le sélecteur de thème). */
  actions?: React.ReactNode;
  /**
   * Destination du lien de la marque. Par défaut l'accueil public (`/`) ;
   * l'espace admin la surcharge vers `/admin`.
   */
  logoHref?: string;
}

// Barre supérieure de l'application : marque à gauche, actions optionnelles et
// bascule de thème à droite. S'adapte au mode clair / sombre. La marque est
// toujours un lien : par défaut vers l'accueil, surchargeable via `logoHref`.
export function AppHeader({ actions, logoHref = "/" }: AppHeaderProps) {
  // Libellé d'accessibilité adapté à la destination de la marque.
  const logoLabel = logoHref === "/admin" ? "Accueil du tableau de bord" : "Accueil";
  return (
    <AppBar
      position="static"
      elevation={0}
      sx={{
        bgcolor: "background.paper",
        color: "text.primary",
        borderBottom: 1,
        borderColor: "divider",
      }}
    >
      <Toolbar sx={{ gap: 1.5 }}>
        <Box sx={{ flexGrow: 1, display: "flex", alignItems: "center" }}>
          <Box
            component={NextLink}
            href={logoHref}
            aria-label={logoLabel}
            sx={{ display: "inline-flex", textDecoration: "none" }}
          >
            <Logo />
          </Box>
        </Box>
        {actions}
        <ColorModeToggle />
      </Toolbar>
    </AppBar>
  );
}
