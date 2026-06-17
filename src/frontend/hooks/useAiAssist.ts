"use client";

import * as React from "react";

// Hook d'orchestration de l'assistance IA (côté client).
//
// Centralise les appels `fetch` vers les routes IA ADMIN et l'état transverse
// (chargement / erreur), pour que les composants restent simples. Aucune
// dépendance serveur : ce hook ne fait que des appels HTTP côté client (la clé
// API reste serveur — voir docs/security.md).

/** Erreur lisible extraite d'une réponse d'API (`{ error?: string }`). */
async function readError(response: Response, fallback: string): Promise<string> {
  const data = (await response.json().catch(() => null)) as
    | { error?: string }
    | null;
  return data?.error ?? fallback;
}

/** Questionnaire renvoyé par la génération (forme minimale exploitée ici). */
interface GeneratedFormResult {
  id: string;
}

export interface UseAiAssist {
  /** Vrai pendant qu'un appel IA est en cours. */
  pending: boolean;
  /** Dernier message d'erreur, ou `null`. */
  error: string | null;
  /** Réinitialise l'erreur courante. */
  resetError: () => void;
  /** Génère un questionnaire à partir d'un prompt ; renvoie l'identifiant créé. */
  generate: (prompt: string) => Promise<GeneratedFormResult>;
  /** Corrige l'orthographe/grammaire d'un texte ; renvoie le texte corrigé. */
  proofread: (text: string) => Promise<string>;
}

export function useAiAssist(): UseAiAssist {
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const resetError = React.useCallback(() => setError(null), []);

  // Exécute un appel IA en gérant `pending`/`error` de façon homogène.
  const run = React.useCallback(
    async <T,>(action: () => Promise<T>): Promise<T> => {
      setPending(true);
      setError(null);
      try {
        return await action();
      } catch (caught) {
        const message =
          caught instanceof Error ? caught.message : "Une erreur est survenue.";
        setError(message);
        throw caught;
      } finally {
        setPending(false);
      }
    },
    [],
  );

  const generate = React.useCallback(
    (prompt: string) =>
      run(async () => {
        const response = await fetch("/api/admin/ai/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt }),
        });
        if (!response.ok) {
          throw new Error(
            await readError(response, "La génération par IA a échoué."),
          );
        }
        return (await response.json()) as GeneratedFormResult;
      }),
    [run],
  );

  const proofread = React.useCallback(
    (text: string) =>
      run(async () => {
        const response = await fetch("/api/admin/ai/proofread", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        });
        if (!response.ok) {
          throw new Error(
            await readError(response, "La correction a échoué."),
          );
        }
        const data = (await response.json()) as { corrected?: string };
        return data.corrected ?? text;
      }),
    [run],
  );

  return { pending, error, resetError, generate, proofread };
}
