import * as React from "react";
import { notFound } from "next/navigation";
import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import InsightsOutlinedIcon from "@mui/icons-material/InsightsOutlined";
import { PageContainer } from "@/frontend/components/PageContainer";
import { EmptyState } from "@/frontend/components/states/EmptyState";
import { QuestionAggregateCard } from "@/frontend/components/viewer/QuestionAggregateCard";
import { getFormResponsesAggregated } from "@/backend/response/responseService";

// Page admin (Server Component) du Response Viewer : visualise les réponses
// agrégées d'un questionnaire (par `id` interne). Sous la garde admin du
// middleware (/admin/* — voir docs/security.md).
//
// - charge l'agrégat côté serveur (`getFormResponsesAggregated`) ;
// - `notFound()` (404) si le questionnaire n'existe pas ;
// - état vide dédié si aucune réponse n'a encore été collectée ;
// - sinon : en-tête (titre, total, accès à l'édition) + une carte par question.
//
// Next.js 16 : `params` est une `Promise`.
export default async function ResponsesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const aggregate = await getFormResponsesAggregated(id);

  if (!aggregate) {
    notFound();
  }

  const { title, totalResponses, questions } = aggregate;

  return (
    <PageContainer maxWidth="md">
      <Stack spacing={4}>
        {/* En-tête : titre, total des réponses et accès à l'édition. */}
        <Stack spacing={2}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            sx={{
              alignItems: { xs: "flex-start", sm: "center" },
              justifyContent: "space-between",
            }}
          >
            <Stack spacing={0.5}>
              <Typography variant="overline" color="text.secondary">
                Réponses
              </Typography>
              <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
                {title}
              </Typography>
            </Stack>
            <Button
              variant="outlined"
              startIcon={<EditOutlinedIcon />}
              href={`/admin/forms/${id}`}
            >
              Modifier le questionnaire
            </Button>
          </Stack>

          <Box>
            <Chip
              icon={<InsightsOutlinedIcon />}
              label={`${totalResponses} réponse${totalResponses > 1 ? "s" : ""} au total`}
              color="primary"
              variant="outlined"
            />
          </Box>
        </Stack>

        {/* Corps : état vide si aucune réponse, sinon une carte par question. */}
        {totalResponses === 0 ? (
          <EmptyState
            title="Aucune réponse pour le moment"
            description="Dès qu'un participant aura soumis le questionnaire, ses réponses apparaîtront ici."
          />
        ) : (
          <Stack spacing={2}>
            {questions.map((question) => (
              <QuestionAggregateCard
                key={question.questionId}
                aggregate={question}
              />
            ))}
          </Stack>
        )}
      </Stack>
    </PageContainer>
  );
}
