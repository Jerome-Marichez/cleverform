"use client";

import * as React from "react";
import type { FormStatus } from "@/shared/schemas";

// Hook d'orchestration des mutations sur les questionnaires (côté dashboard admin).
//
// Centralise les appels `fetch` vers les routes ADMIN et l'état transverse
// (chargement / erreur), pour que les composants de présentation
// (`CreateFormDialog`, `FormCardActions`) restent simples. Aucune dépendance
// Prisma/serveur : ce hook ne fait que des appels HTTP côté client.

/** Erreur lisible extraite d'une réponse d'API (`{ error?: string }`). */
async function readError(
  response: Response,
  fallback: string,
): Promise<string> {
  const data = (await response.json().catch(() => null)) as
    | { error?: string }
    | null;
  return data?.error ?? fallback;
}

/** Corps minimal de création accepté par `POST /api/admin/forms`. */
export interface CreateFormPayload {
  title: string;
  description?: string;
}

/** Questionnaire renvoyé par l'API (forme minimale exploitée côté dashboard). */
interface CreatedForm {
  id: string;
}

export interface UseFormMutations {
  /** Vrai pendant qu'une mutation est en cours. */
  pending: boolean;
  /** Dernier message d'erreur, ou `null`. */
  error: string | null;
  /** Réinitialise l'erreur courante. */
  resetError: () => void;
  /** Crée un questionnaire et renvoie l'identifiant interne créé. */
  createForm: (payload: CreateFormPayload) => Promise<CreatedForm>;
  /** Change le statut d'un questionnaire (publication / clôture). */
  changeStatus: (id: string, status: FormStatus) => Promise<void>;
  /** Supprime un questionnaire. */
  deleteForm: (id: string) => Promise<void>;
}

export function useFormMutations(): UseFormMutations {
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const resetError = React.useCallback(() => setError(null), []);

  // Exécute une mutation en gérant `pending`/`error` de façon homogène.
  // Toute erreur est propagée à l'appelant après avoir renseigné `error`.
  const run = React.useCallback(
    async <T,>(action: () => Promise<T>): Promise<T> => {
      setPending(true);
      setError(null);
      try {
        return await action();
      } catch (caught) {
        const message =
          caught instanceof Error
            ? caught.message
            : "Une erreur est survenue.";
        setError(message);
        throw caught;
      } finally {
        setPending(false);
      }
    },
    [],
  );

  const createForm = React.useCallback(
    (payload: CreateFormPayload) =>
      run(async () => {
        const response = await fetch("/api/admin/forms", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          // Le schéma de création exige au moins une question : on amorce le
          // questionnaire avec une question texte courte modifiable ensuite
          // dans l'éditeur.
          body: JSON.stringify({
            title: payload.title,
            ...(payload.description ? { description: payload.description } : {}),
            questions: [
              {
                label: "Question 1",
                type: "SHORT_TEXT",
                required: false,
                order: 0,
              },
            ],
          }),
        });

        if (!response.ok) {
          throw new Error(
            await readError(response, "Création du questionnaire impossible."),
          );
        }

        return (await response.json()) as CreatedForm;
      }),
    [run],
  );

  const changeStatus = React.useCallback(
    (id: string, status: FormStatus) =>
      run(async () => {
        const response = await fetch(
          `/api/admin/forms/${id}/publish`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status }),
          },
        );

        if (!response.ok) {
          throw new Error(
            await readError(response, "Changement de statut impossible."),
          );
        }
      }),
    [run],
  );

  const deleteForm = React.useCallback(
    (id: string) =>
      run(async () => {
        const response = await fetch(`/api/admin/forms/${id}`, {
          method: "DELETE",
        });

        // 204 (succès) renvoie un corps vide : on ne tente pas de le parser.
        if (!response.ok) {
          throw new Error(
            await readError(response, "Suppression impossible."),
          );
        }
      }),
    [run],
  );

  return {
    pending,
    error,
    resetError,
    createForm,
    changeStatus,
    deleteForm,
  };
}
