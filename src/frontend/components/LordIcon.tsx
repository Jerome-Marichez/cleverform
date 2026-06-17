"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import Box from "@mui/material/Box";

// Déclencheurs d'animation disponibles :
// - "hover" : l'animation rejoue à chaque survol (idéal pour un appel à l'action) ;
// - "loop"  : l'animation tourne en boucle une fois le composant prêt ;
// - "once"  : l'animation joue une seule fois au montage.
export type LordIconTrigger = "hover" | "loop" | "once";

export interface LordIconProps {
  /** Données Lottie de l'icône (JSON lordicon importé localement). */
  icon: object;
  /** Taille de l'icône en pixels (carré). Défaut : 64. */
  size?: number;
  /** Mode de déclenchement de l'animation. Défaut : "hover". */
  trigger?: LordIconTrigger;
  /** Libellé accessible décrivant l'icône (sinon l'icône est décorative). */
  label?: string;
}

// `@lordicon/react` (et son moteur `lottie-web`) dépendent du DOM navigateur
// (shadow DOM, canvas) : ils ne peuvent fonctionner ni au rendu serveur, ni hors
// d'un vrai navigateur. On charge donc le lecteur **dynamiquement, côté client
// uniquement** (`ssr: false`). Tant qu'il n'est pas chargé, on rend un espace
// réservé de la même taille : aucun crash SSR, aucune dépendance réseau.
const LordIconPlayer = dynamic(() => import("./LordIconPlayer"), {
  ssr: false,
  loading: () => null,
});

// Enveloppe client autour de `@lordicon/react`. Le conteneur fixe la taille et la
// teinte (couleur primaire du thème, suivie par les icônes colorisables), et gère
// l'accessibilité : décorative par défaut (`aria-hidden`), ou `img` + libellé.
export function LordIcon({
  icon,
  size = 64,
  trigger = "hover",
  label,
}: LordIconProps) {
  return (
    <Box
      data-testid="lord-icon"
      aria-hidden={label ? undefined : true}
      role={label ? "img" : undefined}
      aria-label={label}
      sx={{
        width: size,
        height: size,
        flexShrink: 0,
        display: "inline-flex",
        color: "primary.main",
      }}
    >
      <LordIconPlayer icon={icon} size={size} trigger={trigger} />
    </Box>
  );
}
