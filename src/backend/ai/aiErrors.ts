// Erreurs métier typées de la couche IA.
//
// Permettent aux Route Handlers de distinguer un échec d'EXPLOITATION de la
// sortie IA (format inexploitable → 502) d'une erreur technique générique (500),
// sans inspecter de chaînes de caractères.

/** La sortie de l'IA est inexploitable (JSON absent/invalide, schéma non respecté). → 502 */
export class AiGenerationError extends Error {
  /** Cause éventuelle (ZodError, SyntaxError de JSON.parse, …). */
  readonly cause?: unknown;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = "AiGenerationError";
    this.cause = cause;
  }
}
