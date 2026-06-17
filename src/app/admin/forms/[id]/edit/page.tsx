import * as React from "react";
import { notFound } from "next/navigation";
import { getForm } from "@/backend/form/formService";
import { FormNotFoundError } from "@/backend/form/formErrors";
import { FormBuilder } from "@/frontend/components/builder/FormBuilder";

// Page d'édition d'un questionnaire (Form Builder). Server Component fin : charge
// le questionnaire par sa clé interne puis délègue l'édition au Client Component
// `FormBuilder`. En Next.js 16, `params` est une Promise.
//
// Sécurité : route sous `/admin`, protégée par `middleware.ts`. La clé interne
// (`id`) ne transite que côté admin — jamais l'identifiant public.

interface EditFormPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditFormPage({ params }: EditFormPageProps) {
  const { id } = await params;

  // On isole la lecture (qui peut échouer) de la construction du JSX : un
  // questionnaire introuvable se traduit par un 404 (`notFound`).
  const form = await getForm(id).catch((error: unknown) => {
    if (error instanceof FormNotFoundError) {
      notFound();
    }
    throw error;
  });

  return (
    <FormBuilder
      formId={form.id}
      status={form.status}
      initialData={{
        title: form.title,
        description: form.description,
        questions: form.questions.map((question) => ({
          label: question.label,
          type: question.type,
          required: question.required,
          options: question.options.map((option) => ({
            label: option.label,
          })),
        })),
      }}
    />
  );
}
