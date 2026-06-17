"use client";

import useMediaQuery from "@mui/material/useMediaQuery";

// Indique si l'utilisateur a activé « réduire les animations » au niveau du
// système (`prefers-reduced-motion: reduce`). Sert de garde côté JS pour les
// effets animés qui ne peuvent pas être désactivés par la seule CSS : icônes
// lordicon en boucle, effet de curseur du fond pointillé, etc.
//
// La CSS globale (voir `src/app/globals.css`) couvre déjà animations et
// transitions ; ce hook complète pour les comportements pilotés en JavaScript.
//
// Repli SSR : `false` (aucune réduction) tant que la requête média n'est pas
// évaluable côté serveur, ce qui évite tout décalage d'hydratation.
export function useReducedMotion(): boolean {
  return useMediaQuery("(prefers-reduced-motion: reduce)", {
    defaultMatches: false,
  });
}
