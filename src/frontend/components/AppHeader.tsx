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
  /** Si fourni, la marque devient un lien interne vers cette destination. */
  logoHref?: string;
}

// Barre supérieure de l'application : marque à gauche, actions optionnelles et
// bascule de thème à droite. S'adapte au mode clair / sombre. La marque peut
// devenir un lien (ex. retour au tableau de bord admin) via `logoHref`.
export function AppHeader({ actions, logoHref }: AppHeaderProps) {
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
          {logoHref ? (
            <Box
              component={NextLink}
              href={logoHref}
              aria-label="Accueil du tableau de bord"
              sx={{ display: "inline-flex", textDecoration: "none" }}
            >
              <Logo />
            </Box>
          ) : (
            <Logo />
          )}
        </Box>
        {actions}
        <ColorModeToggle />
      </Toolbar>
    </AppBar>
  );
}
