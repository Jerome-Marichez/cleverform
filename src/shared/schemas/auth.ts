import { z } from "zod";

// Schéma d'authentification de l'administrateur unique (voir docs/security.md).
// Pas de table `User` : seul un mot de passe est attendu, comparé côté backend
// à `ADMIN_PASSWORD` (variable d'environnement). On valide ici uniquement la
// **forme** de l'entrée (mot de passe non vide).
export const loginSchema = z.object({
  password: z.string().min(1, { error: "Le mot de passe est requis." }),
});
export type LoginInput = z.infer<typeof loginSchema>;
