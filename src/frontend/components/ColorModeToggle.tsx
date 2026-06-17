"use client";

import * as React from "react";
import { useColorScheme } from "@mui/material/styles";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import LightModeIcon from "@mui/icons-material/LightModeOutlined";
import DarkModeIcon from "@mui/icons-material/DarkModeOutlined";
import SettingsBrightnessIcon from "@mui/icons-material/SettingsBrightnessOutlined";

// Bascule du thème : clair → sombre → système → clair…
// Le mode "système" suit la préférence OS (prefers-color-scheme).
//
// Avant le montage côté client, le mode réel est inconnu (rendu SSR neutre) :
// on affiche un bouton désactivé pour éviter toute différence d'hydratation.

const ORDER = ["system", "light", "dark"] as const;
type Mode = (typeof ORDER)[number];

const META: Record<Mode, { label: string; icon: React.ReactNode }> = {
  system: { label: "Thème : système", icon: <SettingsBrightnessIcon /> },
  light: { label: "Thème : clair", icon: <LightModeIcon /> },
  dark: { label: "Thème : sombre", icon: <DarkModeIcon /> },
};

// Vrai uniquement côté client (après hydratation). Évite une différence
// d'hydratation sans recourir à un setState dans un effet.
function useMounted(): boolean {
  return React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

export function ColorModeToggle() {
  const { mode, setMode } = useColorScheme();
  const mounted = useMounted();

  if (!mounted) {
    return (
      <IconButton aria-label="Basculer le thème" color="inherit" disabled>
        <SettingsBrightnessIcon />
      </IconButton>
    );
  }

  const current: Mode = mode ?? "system";
  const next = ORDER[(ORDER.indexOf(current) + 1) % ORDER.length];

  return (
    <Tooltip title={META[current].label}>
      <IconButton
        aria-label={META[current].label}
        color="inherit"
        onClick={() => setMode(next)}
      >
        {META[current].icon}
      </IconButton>
    </Tooltip>
  );
}
