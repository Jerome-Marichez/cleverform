"use client";

import * as React from "react";
import { Player } from "@lordicon/react";
import type { LordIconTrigger } from "./LordIcon";

export interface LordIconPlayerProps {
  /** Données Lottie de l'icône. */
  icon: object;
  /** Taille en pixels. */
  size: number;
  /** Mode de déclenchement de l'animation. */
  trigger: LordIconTrigger;
}

// Lecteur lordicon proprement dit. Isolé dans son propre fichier car il importe
// `@lordicon/react` / `lottie-web`, qui dépendent du DOM navigateur : il est donc
// chargé **uniquement côté client** via `next/dynamic` (voir LordIcon.tsx).
//
// L'animation est pilotée de façon impérative via la `ref` du Player :
// - "hover" : rejoue depuis le début à chaque survol ;
// - "loop"  : relance l'animation à chaque fin (`onComplete`) ;
// - "once"  : joue une seule fois quand le Player est prêt (`onReady`).
export default function LordIconPlayer({
  icon,
  size,
  trigger,
}: LordIconPlayerProps) {
  const playerRef = React.useRef<Player>(null);

  const handleReady = React.useCallback(() => {
    if (trigger === "loop" || trigger === "once") {
      playerRef.current?.playFromBeginning();
    }
  }, [trigger]);

  const handleComplete = React.useCallback(() => {
    if (trigger === "loop") {
      playerRef.current?.playFromBeginning();
    }
  }, [trigger]);

  const handleMouseEnter = React.useCallback(() => {
    if (trigger === "hover") {
      playerRef.current?.playFromBeginning();
    }
  }, [trigger]);

  return (
    <span
      onMouseEnter={handleMouseEnter}
      style={{ display: "inline-flex", width: size, height: size }}
    >
      <Player
        ref={playerRef}
        icon={icon}
        size={size}
        onReady={handleReady}
        onComplete={handleComplete}
      />
    </span>
  );
}
