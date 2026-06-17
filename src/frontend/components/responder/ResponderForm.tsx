"use client";

import * as React from "react";
import { Controller } from "react-hook-form";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import LinearProgress from "@mui/material/LinearProgress";
import { AppHeader } from "@/frontend/components/AppHeader";
import { PageContainer } from "@/frontend/components/PageContainer";
import { QuestionField } from "@/frontend/components/fields/QuestionField";
import { ThankYouScreen } from "@/frontend/components/responder/ThankYouScreen";
import { useResponderForm, optionLabels } from "@/frontend/hooks/useResponderForm";
import type { AnswerInput, PublicForm, SubmitResponseInput } from "@/shared/schemas";

export interface ResponderFormProps {
  form: PublicForm;
}

// Form Responder : page publique de remplissage d'un questionnaire publié.
//
// React Hook Form pilote un `AnswerInput` par question (validation client par le
// même schéma Zod que le backend). Chaque question est rendue via le dispatcher
// `QuestionField`, en convertissant valeur d'affichage ⇄ `AnswerInput`. À la
// soumission, POST `/api/public/forms/[publicId]/responses` ; en cas de succès,
// un écran de remerciement remplace le formulaire. États de chargement et
// d'erreur soignés ; theme-aware.
export function ResponderForm({ form }: ResponderFormProps) {
  const { form: rhf, toFieldValue, toAnswer } = useResponderForm(form);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = rhf;

  const [submitted, setSubmitted] = React.useState(false);
  const [serverError, setServerError] = React.useState<string | null>(null);

  const onSubmit = handleSubmit(async (values: SubmitResponseInput) => {
    setServerError(null);
    try {
      const response = await fetch(
        `/api/public/forms/${form.publicId}/responses`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        },
      );

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as
          | { error?: string; issues?: string[] }
          | null;
        const message =
          data?.issues && data.issues.length > 0
            ? data.issues.join(" ")
            : (data?.error ?? "L'envoi a échoué. Réessayez.");
        setServerError(message);
        return;
      }

      setSubmitted(true);
    } catch {
      setServerError("Une erreur réseau est survenue. Réessayez.");
    }
  });

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        bgcolor: "background.default",
      }}
    >
      <AppHeader />
      <Box component="main" sx={{ flexGrow: 1 }}>
        <PageContainer maxWidth="sm">
          {submitted ? (
            <ThankYouScreen title={form.title} />
          ) : (
            <Stack spacing={3}>
              {/* En-tête du questionnaire : titre + description. */}
              <Stack spacing={1}>
                <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
                  {form.title}
                </Typography>
                {form.description ? (
                  <Typography color="text.secondary">
                    {form.description}
                  </Typography>
                ) : null}
              </Stack>

              <Card>
                <CardContent sx={{ p: { xs: 2.5, sm: 4 } }}>
                  <Stack
                    component="form"
                    onSubmit={onSubmit}
                    noValidate
                    spacing={4}
                  >
                    {serverError ? (
                      <Alert severity="error" role="alert">
                        {serverError}
                      </Alert>
                    ) : null}

                    {form.questions.map((question, index) => {
                      const fieldId = `question-${question.id}`;
                      const fieldError = errors.answers?.[index];
                      return (
                        <Controller
                          key={question.id}
                          name={`answers.${index}`}
                          control={control}
                          render={({ field }) => {
                            const answer = field.value as AnswerInput;
                            return (
                              <QuestionField
                                id={fieldId}
                                label={question.label}
                                type={question.type}
                                required={question.required}
                                options={optionLabels(question)}
                                value={toFieldValue(question, answer)}
                                onChange={(next) =>
                                  field.onChange(toAnswer(question, next))
                                }
                                error={fieldError?.message}
                                disabled={isSubmitting}
                              />
                            );
                          }}
                        />
                      );
                    })}

                    {isSubmitting ? <LinearProgress aria-label="Envoi en cours" /> : null}

                    <Button
                      type="submit"
                      variant="contained"
                      size="large"
                      loading={isSubmitting}
                      sx={{ alignSelf: "flex-start" }}
                    >
                      Envoyer mes réponses
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            </Stack>
          )}
        </PageContainer>
      </Box>
    </Box>
  );
}
