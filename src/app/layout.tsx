import type { Metadata } from "next";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v16-appRouter";
import InitColorSchemeScript from "@mui/material/InitColorSchemeScript";
import "./globals.css";
import { Providers } from "@/frontend/Providers";

export const metadata: Metadata = {
  title: "CleverForm",
  description: "Mini-clone de Typeform — Form Builder & Responder",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body>
        {/* Applique la préférence de couleur (système / clair / sombre) AVANT
            l'hydratation, pour éviter tout flash (FOUC). `attribute="class"` doit
            matcher le `colorSchemeSelector` du thème (voir src/frontend/theme.ts). */}
        <InitColorSchemeScript attribute="class" defaultMode="system" />
        {/* Cache Emotion pour le rendu SSR de MUI en App Router (boot sans FOUC). */}
        <AppRouterCacheProvider options={{ key: "mui" }}>
          <Providers>{children}</Providers>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
