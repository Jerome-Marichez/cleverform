import Box from "@mui/material/Box";
import { AppHeader } from "@/frontend/components/AppHeader";
import { PageContainer } from "@/frontend/components/PageContainer";
import { ErrorState } from "@/frontend/components/states/ErrorState";

// 404 du Form Responder : affiché quand le `publicId` ne correspond à aucun
// questionnaire **publié** (inexistant, brouillon ou clos). Le message reste
// volontairement neutre — on ne révèle pas la cause exacte (cf. docs/security.md).
export default function ResponderNotFound() {
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
      <Box
        component="main"
        sx={{ flexGrow: 1, display: "flex", alignItems: "center" }}
      >
        <PageContainer maxWidth="sm">
          <ErrorState
            title="Questionnaire indisponible"
            message="Ce questionnaire n'existe pas ou n'est plus accessible. Vérifiez le lien qui vous a été communiqué."
          />
        </PageContainer>
      </Box>
    </Box>
  );
}
