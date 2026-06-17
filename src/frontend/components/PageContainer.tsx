import * as React from "react";
import Container from "@mui/material/Container";
import type { ContainerProps } from "@mui/material/Container";

export interface PageContainerProps {
  children: React.ReactNode;
  /** Largeur maximale du contenu (défaut : "md"). */
  maxWidth?: ContainerProps["maxWidth"];
}

// Conteneur de page : largeur maximale et espacements verticaux cohérents
// sur l'ensemble de l'application (admin et public).
export function PageContainer({ children, maxWidth = "md" }: PageContainerProps) {
  return (
    <Container maxWidth={maxWidth} sx={{ py: { xs: 4, sm: 6 } }}>
      {children}
    </Container>
  );
}
