// Erreurs métier typées de la couche Form.
//
// Elles permettent aux Route Handlers de traduire une cause métier en code HTTP
// approprié (404 introuvable, 409 transition invalide) sans inspecter de chaînes.

/** Classe de base : marque une erreur comme « métier » (vs technique). */
export abstract class FormDomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

/** Le questionnaire demandé n'existe pas. → 404 */
export class FormNotFoundError extends FormDomainError {
  constructor(id: string) {
    super(`Aucun questionnaire ne correspond à l'identifiant « ${id} ».`);
  }
}

/** La transition de statut demandée n'est pas autorisée. → 409 */
export class InvalidStatusTransitionError extends FormDomainError {
  constructor(from: string, to: string) {
    super(`Transition de statut interdite : ${from} → ${to}.`);
  }
}
