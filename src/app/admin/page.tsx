import * as React from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import QuizIcon from "@mui/icons-material/QuizOutlined";
import { listForms } from "@/backend/form/formService";
import { EmptyState } from "@/frontend/components/states/EmptyState";
import { AdminFormCard } from "@/frontend/components/admin/AdminFormCard";
import { NewFormButton } from "@/frontend/components/admin/NewFormButton";
import { GenerateWithAiButton } from "@/frontend/components/admin/GenerateWithAiButton";

// Tableau de bord administrateur (Server Component) : liste des questionnaires.
//
// La lecture des données se fait directement via `listForms()` (couche backend)
// — pas d'appel HTTP côté serveur. Les interactions (création, génération IA,
// publication, clôture, suppression) sont déléguées à des composants clients.
//
// `dynamic = "force-dynamic"` : la liste doit refléter l'état courant de la base
// (après création/suppression via `router.refresh()`), jamais une version mise
// en cache au build.
export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const forms = await listForms();

  return (
    <Stack spacing={4}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        sx={{ alignItems: { sm: "center" }, justifyContent: "space-between" }}
      >
        <Stack spacing={0.5}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
            Questionnaires
          </Typography>
          <Typography color="text.secondary">
            Créez, publiez et gérez vos questionnaires.
          </Typography>
        </Stack>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
          <GenerateWithAiButton />
          <NewFormButton />
        </Stack>
      </Stack>

      {forms.length === 0 ? (
        <EmptyState
          icon={<QuizIcon />}
          title="Aucun questionnaire pour le moment"
          description="Créez votre premier questionnaire, ou laissez l'IA en générer un à partir d'un simple sujet."
          action={
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
              <GenerateWithAiButton />
              <NewFormButton label="Créer un questionnaire" />
            </Stack>
          }
        />
      ) : (
        <Box
          sx={{
            display: "grid",
            gap: 2.5,
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, 1fr)",
              md: "repeat(3, 1fr)",
            },
          }}
        >
          {forms.map((form) => (
            <AdminFormCard
              key={form.id}
              id={form.id}
              title={form.title}
              description={form.description}
              status={form.status}
              questionCount={form.questions.length}
              updatedAt={form.updatedAt.toISOString()}
            />
          ))}
        </Box>
      )}
    </Stack>
  );
}
