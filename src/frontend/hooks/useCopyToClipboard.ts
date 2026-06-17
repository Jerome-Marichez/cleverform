"use client";

import * as React from "react";

// Hook de copie dans le presse-papier, indépendant de toute UI.
//
// Utilise l'API moderne `navigator.clipboard` quand elle est disponible (HTTPS /
// localhost), avec un **repli** historique (`document.execCommand("copy")`) pour
// les contextes non sécurisés. Renvoie un booléen de succès afin que l'appelant
// décide du retour visuel (toast de confirmation ou d'erreur).

/** Tente d'écrire `text` dans le presse-papier. Renvoie `true` si réussi. */
async function writeToClipboard(text: string): Promise<boolean> {
  if (typeof navigator !== "undefined" && navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // On bascule sur le repli ci-dessous (permission refusée, contexte non sûr…).
    }
  }

  if (typeof document === "undefined") {
    return false;
  }

  // Repli : champ texte temporaire hors écran + commande de copie.
  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "absolute";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}

export interface UseCopyToClipboard {
  /** Copie `text` ; renvoie `true` en cas de succès. */
  copy: (text: string) => Promise<boolean>;
}

/** Expose une fonction `copy` stable pour écrire dans le presse-papier. */
export function useCopyToClipboard(): UseCopyToClipboard {
  const copy = React.useCallback((text: string) => writeToClipboard(text), []);
  return { copy };
}
