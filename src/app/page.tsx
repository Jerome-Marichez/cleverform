"use client";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Link from "@mui/material/Link";
import { AppHeader } from "@/frontend/components/AppHeader";
import { PageContainer } from "@/frontend/components/PageContainer";
import { DottedBackground } from "@/frontend/components/DottedBackground";
import { LordIcon } from "@/frontend/components/LordIcon";
import createIcon from "../../public/icons/create.json";
import shareIcon from "../../public/icons/share.json";
import analyzeIcon from "../../public/icons/analyze.json";

// Les trois fonctions clés du produit, illustrées par une icône animée lordicon.
const FEATURES = [
  {
    icon: createIcon,
    title: "Créez",
    description:
      "Concevez vos questionnaires sur mesure : types de questions variés, options et logique.",
  },
  {
    icon: shareIcon,
    title: "Diffusez",
    description:
      "Partagez un lien public et collectez des réponses en continu, sans friction.",
  },
  {
    icon: analyzeIcon,
    title: "Visualisez",
    description:
      "Consultez et analysez les réponses collectées d'un coup d'œil.",
  },
] as const;

// Page d'accueil publique : présente CleverConnect et oriente vers l'espace
// d'administration. Fond pointillé décoratif sur toute la hauteur, hero centré,
// icônes animées et appels à l'action. Soignée, responsive et theme-aware.
export default function Home() {
  return (
    <Box
      sx={{
        position: "relative",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        bgcolor: "background.default",
      }}
    >
      {/* Motif de points en surimpression, derrière tout le contenu. */}
      <DottedBackground />

      <Box sx={{ position: "relative", zIndex: 1 }}>
        <AppHeader />
      </Box>

      <Box
        component="main"
        sx={{
          position: "relative",
          zIndex: 1,
          flexGrow: 1,
          display: "flex",
          alignItems: "center",
        }}
      >
        <PageContainer maxWidth="md">
          <Stack spacing={{ xs: 5, sm: 7 }} sx={{ alignItems: "center" }}>
            {/* Hero */}
            <Stack spacing={2.5} sx={{ alignItems: "center", textAlign: "center" }}>
              <Typography
                variant="h2"
                component="h1"
                sx={{ fontWeight: 700, fontSize: { xs: "2.25rem", sm: "3rem" } }}
              >
                CleverConnect
              </Typography>
              <Typography
                variant="h6"
                component="p"
                color="text.secondary"
                sx={{ maxWidth: 560, fontWeight: 400 }}
              >
                Créez, diffusez et visualisez vos questionnaires — avec une
                génération assistée par IA pour démarrer en un prompt.
              </Typography>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={2}
                sx={{ pt: 1, alignItems: "center" }}
              >
                <Button variant="contained" size="large" href="/admin">
                  Accéder à l&apos;espace admin
                </Button>
                <Link
                  href="/admin"
                  underline="hover"
                  sx={{ fontWeight: 600, color: "text.secondary" }}
                >
                  Voir les réponses
                </Link>
              </Stack>
            </Stack>

            {/* Fonctions clés illustrées par des icônes animées */}
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={{ xs: 4, sm: 3 }}
              sx={{ width: "100%", justifyContent: "center" }}
            >
              {FEATURES.map((feature) => (
                <Stack
                  key={feature.title}
                  spacing={1.5}
                  sx={{ flex: 1, alignItems: "center", textAlign: "center", maxWidth: 260 }}
                >
                  <LordIcon
                    icon={feature.icon}
                    size={72}
                    trigger="loop"
                    label={feature.title}
                  />
                  <Typography variant="h6" component="h2">
                    {feature.title}
                  </Typography>
                  <Typography color="text.secondary" variant="body2">
                    {feature.description}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </Stack>
        </PageContainer>
      </Box>
    </Box>
  );
}
