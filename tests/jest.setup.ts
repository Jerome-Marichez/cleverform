// Setup Jest pour les tests frontend (environnement jsdom) :
// - matchers DOM (`toBeInTheDocument`, `toHaveTextContent`…) ;
// - matcher d'accessibilité `toHaveNoViolations` (jest-axe).
import "@testing-library/jest-dom";
import { toHaveNoViolations } from "jest-axe";

expect.extend(toHaveNoViolations);

// jsdom n'implémente pas `window.matchMedia`, dont dépend `useMediaQuery` de MUI
// (utilisé par le hook `useReducedMotion`). On fournit un repli neutre : aucune
// requête média ne correspond (équivalent à « pas de préférence particulière »).
if (typeof window !== "undefined" && !window.matchMedia) {
  window.matchMedia = (query: string): MediaQueryList =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList;
}
