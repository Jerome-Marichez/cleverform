"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import { loginSchema, type LoginInput } from "@/shared/schemas";
import { AppHeader } from "@/frontend/components/AppHeader";
import { PageContainer } from "@/frontend/components/PageContainer";

// Cible de redirection autorisée uniquement si elle reste **interne** (chemin
// absolu sans schéma ni double slash) : empêche un open redirect via `?from=`.
function safeRedirect(from: string | null): string {
  if (from && from.startsWith("/") && !from.startsWith("//")) {
    return from;
  }
  return "/admin";
}

// Formulaire de connexion administrateur (RHF + zodResolver sur loginSchema).
// POST `/api/auth/login`, gère les états de chargement et d'erreur, puis redirige
// vers la cible d'origine (`from`) ou `/admin`. Soigné et theme-aware.
export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const target = safeRedirect(searchParams.get("from"));

  const [serverError, setServerError] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { password: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        setServerError(data?.error ?? "Connexion impossible. Réessayez.");
        return;
      }

      router.replace(target);
      router.refresh();
    } catch {
      setServerError("Une erreur réseau est survenue. Réessayez.");
    }
  });

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
        <PageContainer maxWidth="xs">
          <Card>
            <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
              <Stack spacing={3} component="form" onSubmit={onSubmit} noValidate>
                <Stack spacing={1.5} sx={{ alignItems: "center", textAlign: "center" }}>
                  <LockOutlinedIcon color="primary" sx={{ fontSize: 40 }} />
                  <Typography variant="h5" component="h1" sx={{ fontWeight: 700 }}>
                    Espace administrateur
                  </Typography>
                  <Typography color="text.secondary" variant="body2">
                    Saisissez le mot de passe pour accéder au tableau de bord.
                  </Typography>
                </Stack>

                {serverError ? (
                  <Alert severity="error" role="alert">
                    {serverError}
                  </Alert>
                ) : null}

                <TextField
                  label="Mot de passe"
                  type="password"
                  autoComplete="current-password"
                  autoFocus
                  fullWidth
                  error={Boolean(errors.password)}
                  helperText={errors.password?.message}
                  disabled={isSubmitting}
                  {...register("password")}
                />

                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  fullWidth
                  loading={isSubmitting}
                >
                  Se connecter
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </PageContainer>
      </Box>
    </Box>
  );
}
