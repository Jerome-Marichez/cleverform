"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import { useTheme } from "@mui/material/styles";
import { useReducedMotion } from "@/frontend/hooks/useReducedMotion";

export interface DottedBackgroundProps {
  /** Contenu posé au-dessus du motif. Si absent, le composant sert d'overlay. */
  children?: React.ReactNode;
  /** Espacement entre les points, en pixels. Défaut : 24. */
  gap?: number;
  /** Rayon des points, en pixels. Défaut : 1.5. */
  dotSize?: number;
  /**
   * Active le halo interactif qui suit le curseur (effet « spotlight »).
   * Défaut : true. Ignoré si l'utilisateur a demandé la réduction des animations.
   */
  interactive?: boolean;
}

// Fondu vers les bords appliqué à la couche de base, pour un rendu plus doux.
const EDGE_FADE = "radial-gradient(ellipse at center, black 55%, transparent 100%)";
// Rayon du halo « spotlight » autour du curseur (override possible via `--dot-r`).
const HALO_RADIUS = "150px";

// Fond décoratif : un motif de points verts subtil obtenu par un
// `radial-gradient` répété (`backgroundImage`). La couleur dérive du `secondary`
// du thème à faible opacité, ce qui le rend **theme-aware** : il s'adapte au mode
// clair comme sombre (opacité légèrement renforcée en sombre pour rester lisible).
//
// Au passage du curseur, une **seconde couche** de points plus opaques se révèle
// dans un halo qui suit la souris (effet « spotlight »). L'effet est obtenu sans
// aucune librairie : un `mask-image` en `radial-gradient` centré sur deux
// variables CSS (`--mx`/`--my`) mises à jour au `mousemove` via
// `requestAnimationFrame` — donc **sans re-render React**.
//
// Accessibilité : les couches sont purement décoratives (`aria-hidden`) et ne
// captent pas les événements (`pointerEvents: "none"`) ; l'écoute se fait sur
// `window`. Le halo n'est pas monté si `prefers-reduced-motion` est actif (voir
// `useReducedMotion`) ou si `interactive` est désactivé : on retombe alors sur le
// motif statique d'origine.
export function DottedBackground({
  children,
  gap = 24,
  dotSize = 1.5,
  interactive = true,
}: DottedBackgroundProps) {
  const theme = useTheme();
  const accent =
    theme.vars?.palette.secondary.main ?? theme.palette.secondary.main;
  // Opacité plus forte en sombre : le vert lime ressort moins sur fond foncé.
  const isDark = theme.palette.mode === "dark";
  const baseColor = withAlpha(accent, isDark ? 0.18 : 0.14);
  // Le halo est nettement plus marqué pour « éclairer » les points survolés.
  const haloColor = withAlpha(accent, isDark ? 0.5 : 0.45);
  // Points du halo très légèrement grossis pour un effet de bloom.
  const haloDotSize = dotSize + 0.6;

  const reducedMotion = useReducedMotion();
  // Le halo n'est monté que si l'effet est demandé ET que l'utilisateur n'a pas
  // réclamé la réduction des animations.
  const showHalo = interactive && !reducedMotion;

  const haloRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (!showHalo) return;
    const el = haloRef.current;
    if (el === null) return;

    let frame = 0;
    let pointerX = 0;
    let pointerY = 0;

    // Appliqué au plus une fois par frame : on convertit les coordonnées
    // viewport du curseur en coordonnées locales à la couche, puis on positionne
    // le halo et on le rend visible.
    const apply = () => {
      frame = 0;
      const rect = el.getBoundingClientRect();
      el.style.setProperty("--mx", `${pointerX - rect.left}px`);
      el.style.setProperty("--my", `${pointerY - rect.top}px`);
      el.style.opacity = "1";
    };

    const onMove = (event: MouseEvent) => {
      pointerX = event.clientX;
      pointerY = event.clientY;
      if (frame === 0) frame = requestAnimationFrame(apply);
    };

    // Curseur hors de la fenêtre : on estompe le halo en douceur (transition CSS).
    const onLeave = () => {
      el.style.opacity = "0";
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("mouseleave", onLeave);
    window.addEventListener("blur", onLeave);

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseleave", onLeave);
      window.removeEventListener("blur", onLeave);
      if (frame !== 0) cancelAnimationFrame(frame);
    };
  }, [showHalo]);

  // Couche de base : le motif statique, toujours présent.
  const baseLayer = (
    <Box
      aria-hidden
      data-dotted-layer="base"
      sx={{
        position: "absolute",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
        backgroundImage: `radial-gradient(${baseColor} ${dotSize}px, transparent ${dotSize}px)`,
        backgroundSize: `${gap}px ${gap}px`,
        maskImage: EDGE_FADE,
        WebkitMaskImage: EDGE_FADE,
      }}
    />
  );

  // Couche halo : points plus opaques, révélés uniquement dans le disque centré
  // sur le curseur grâce au `mask-image`. Estompée par défaut (opacity 0).
  const haloLayer = showHalo ? (
    <Box
      ref={haloRef}
      aria-hidden
      data-dotted-layer="halo"
      sx={{
        position: "absolute",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
        opacity: 0,
        transition: "opacity 240ms ease-out",
        backgroundImage: `radial-gradient(${haloColor} ${haloDotSize}px, transparent ${haloDotSize}px)`,
        backgroundSize: `${gap}px ${gap}px`,
        "--mx": "-9999px",
        "--my": "-9999px",
        maskImage: `radial-gradient(circle var(--dot-r, ${HALO_RADIUS}) at var(--mx) var(--my), black 0%, transparent 70%)`,
        WebkitMaskImage: `radial-gradient(circle var(--dot-r, ${HALO_RADIUS}) at var(--mx) var(--my), black 0%, transparent 70%)`,
      }}
    />
  ) : null;

  const layers = (
    <React.Fragment>
      {baseLayer}
      {haloLayer}
    </React.Fragment>
  );

  // Usage en overlay simple (pas d'enfants) : le parent gère le positionnement.
  if (children === undefined) {
    return layers;
  }

  return (
    <Box sx={{ position: "relative" }}>
      {layers}
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
