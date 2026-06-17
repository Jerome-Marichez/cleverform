import * as React from "react";
import Box from "@mui/material/Box";
import { AppHeader } from "@/frontend/components/AppHeader";
import { PageContainer } from "@/frontend/components/PageContainer";
import { LogoutButton } from "@/frontend/components/admin/LogoutButton";

// Coquille de l'espace d'administration (Server Component).
//
// C'est CE layout qui porte l'en-tête admin : marque cliquable vers `/admin`,
// bouton de déconnexion, puis le contenu de la page dans un conteneur commun.
// Les pages admin n'ajoutent donc pas leur propre `AppHeader`.
//
// L'accès est protégé en amont par `middleware.ts` (voir docs/security.md) : ce
// layout suppose une session valide.
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        bgcolor: "background.default",
      }}
    >
      <AppHeader logoHref="/admin" actions={<LogoutButton />} />
      <Box component="main" sx={{ flexGrow: 1 }}>
        <PageContainer maxWidth="lg">{children}</PageContainer>
      </Box>
    </Box>
  );
}
