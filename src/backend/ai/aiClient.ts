// Client Claude (Anthropic) — couche RÉSEAU fine de l'assistance IA.
//
// Ce module est volontairement minimal et NON couvert par les tests unitaires :
// il se contente d'instancier le SDK et d'émettre une requête. Toute la logique
// exploitable (extraction / validation / nettoyage de la sortie) vit dans
// `aiService.ts` et reste testable sans clé ni réseau (voir docs/testing.md).
//
// La clé API (`ANTHROPIC_API_KEY`) est lue côté serveur uniquement ; elle n'est
// jamais transmise au client (voir docs/security.md).

import Anthropic from "@anthropic-ai/sdk";

/**
 * Modèle utilisé pour toute l'assistance IA. Choix de Haiku 4.5 : rapide et
 * stable — on privilégie une IA pertinente et STABLE plutôt que sophistiquée
 * mais instable (cf. critères du projet).
 */
export const AI_MODEL = "claude-haiku-4-5-20251001";

/** Plafond de tokens de sortie (suffisant pour un questionnaire complet). */
const MAX_TOKENS = 4096;

/** Erreur levée lorsque la clé API n'est pas configurée. */
export class MissingApiKeyError extends Error {
  constructor() {
    super(
      "La clé ANTHROPIC_API_KEY est manquante : l'assistance IA est indisponible.",
    );
    this.name = "MissingApiKeyError";
  }
}

/**
 * Erreur levée lorsque l'API Anthropic refuse l'authentification ou l'accès
 * (clé invalide, révoquée ou sans permission). Du point de vue produit, c'est
 * une **assistance IA indisponible** (config), pas une erreur interne : la route
 * la traduit en 503, comme pour une clé absente.
 */
export class AiUnavailableError extends Error {
  constructor() {
    super(
      "L'assistance IA est indisponible : l'authentification auprès du fournisseur a échoué.",
    );
    this.name = "AiUnavailableError";
  }
}

/** Instancie le client Anthropic (échoue clairement si la clé est absente). */
function createClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new MissingApiKeyError();
  }
  return new Anthropic({ apiKey });
}

/**
 * Émet une requête au modèle et renvoie le TEXTE BRUT concaténé de la réponse.
 * Fonction fine (réseau) : pas de parsing ni de validation ici.
 *
 * @param system  prompt système (cadre / consignes de format).
 * @param user    message utilisateur (contenu de la demande).
 * @throws MissingApiKeyError si `ANTHROPIC_API_KEY` est absente.
 */
export async function callClaude(system: string, user: string): Promise<string> {
  const client = createClient();

  let message: Anthropic.Message;
  try {
    message = await client.messages.create({
      model: AI_MODEL,
      max_tokens: MAX_TOKENS,
      system,
      messages: [{ role: "user", content: user }],
    });
  } catch (error) {
    // Clé invalide / révoquée / sans permission : Anthropic répond 401 ou 403.
    // On traduit en « IA indisponible » (config) plutôt qu'en erreur interne.
    if (
      error instanceof Anthropic.APIError &&
      (error.status === 401 || error.status === 403)
    ) {
      throw new AiUnavailableError();
    }
    throw error;
  }

  // La réponse est une liste de blocs ; on ne conserve que le texte.
  return message.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("")
    .trim();
}
