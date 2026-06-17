"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Button from "@mui/material/Button";
import LogoutIcon from "@mui/icons-material/Logout";

// Bouton de déconnexion de l'espace administrateur. POST `/api/auth/logout`
// (efface le cookie de session) puis redirige vers `/login`. Affiche un état
// de chargement pendant la requête. Theme-aware via le bouton MUI.
export function LogoutButton() {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);

  const handleLogout = async () => {
    setPending(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // La déconnexion reste idempotente : même en cas d'erreur réseau, on
      // renvoie l'utilisateur vers la page de connexion.
    } finally {
      router.replace("/login");
      router.refresh();
    }
  };

  return (
    <Button
      color="inherit"
      startIcon={<LogoutIcon />}
      onClick={handleLogout}
      loading={pending}
    >
      Déconnexion
    </Button>
  );
}
