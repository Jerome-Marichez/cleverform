import * as React from "react";
import { LoginForm } from "@/frontend/components/auth/LoginForm";

// Page de connexion à l'espace administrateur.
//
// `LoginForm` lit `useSearchParams` (paramètre `from`) : il doit être encapsulé
// dans un `Suspense` côté App Router (Next.js 16) pour le rendu statique.
export default function LoginPage() {
  return (
    <React.Suspense>
      <LoginForm />
    </React.Suspense>
  );
}
