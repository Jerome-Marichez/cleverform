"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import { useTheme } from "@mui/material/styles";

export interface DottedBackgroundProps {
  /** Contenu posé au-dessus du motif. Si absent, le composant sert d'overlay. */
  children?: React.ReactNode;
  /** Espacement entre les points, en pixels. Défaut : 24. */
  gap?: number;
  /** Rayon des points, en pixels. Défaut : 1.5. */
  dotSize?: number;
}

// Fond décoratif : un motif de points verts subtil obtenu par un
// `radial-gradient` répété (`backgroundImage`). La couleur dérive du `secondary`
// du thème à faible opacité, ce qui le rend **theme-aware** : il s'adapte au mode
// clair comme sombre (opacité légèrement renforcée en sombre pour rester lisible).
//
// Le motif est purement décoratif (`aria-hidden`) et ne capte pas les événements
// (`pointerEvents: "none"`) : il se place **derrière** le contenu.
export function DottedBackground({
  children,
  gap = 24,
  dotSize = 1.5,
}: DottedBackgroundProps) {
  const theme = useTheme();
  const accent =
    theme.vars?.palette.secondary.main ?? theme.palette.secondary.main;
  // Opacité plus forte en sombre : le vert lime ressort moins sur fond foncé.
  const isDark = theme.palette.mode === "dark";
  const dotColor = withAlpha(accent, isDark ? 0.18 : 0.14);

  const layer = (
    <Box
      aria-hidden
      sx={{
        position: "absolute",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
        backgroundImage: `radial-gradient(${dotColor} ${dotSize}px, transparent ${dotSize}px)`,
        backgroundSize: `${gap}px ${gap}px`,
        // Léger fondu vers les bords pour un rendu plus doux.
        maskImage:
          "radial-gradient(ellipse at center, black 55%, transparent 100%)",
        WebkitMaskImage:
          "radial-gradient(ellipse at center, black 55%, transparent 100%)",
      }}
    />
  );

  // Usage en overlay simple (pas d'enfants) : le parent gère le positionnement.
  if (children === undefined) {
    return layer;
  }

  return (
    <Box sx={{ position: "relative" }}>
      {layer}
      <Box sx={{ position: "relative", zIndex: 1 }}>{children}</Box>
    </Box>
  );
}

// Applique une opacité à une couleur hexadécimale (#rgb ou #rrggbb) en la
// convertissant en `rgba(...)`. Les couleurs non hexadécimales sont renvoyées
// telles quelles (fallback sûr).
function withAlpha(color: string, alpha: number): string {
  const hex = color.trim();
  const match = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.exec(hex);
  if (!match) return color;

  let value = match[1];
  if (value.length === 3) {
    value = value
      .split("")
      .map((c) => c + c)
      .join("");
  }
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
