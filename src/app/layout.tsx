import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/interface/Providers";

export const metadata: Metadata = {
  title: "CleverConnect",
  description: "Mini-clone de Typeform — Form Builder & Responder",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
