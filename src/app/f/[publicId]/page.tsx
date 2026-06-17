import { notFound } from "next/navigation";

import {
  getPublicForm,
  FormNotFoundError,
  FormNotPublishedError,
} from "@/backend/response/responseService";
import { ResponderForm } from "@/frontend/components/responder/ResponderForm";
import type { PublicForm } from "@/shared/schemas";

// Form Responder PUBLIC : page de remplissage d'un questionnaire **publié**,
// adressé par son seul identifiant opaque `publicId` (jamais l'`id` interne).
//
// Server Component : charge le DTO public côté serveur (aucune fuite de données
// admin), puis délègue le remplissage à `ResponderForm` (Client Component).
// Un questionnaire inexistant, en brouillon ou clos donne un 404 (`notFound`),
// sans révéler la cause exacte.
//
// Next.js 16 : `params` est asynchrone (Promise).
export default async function ResponderPage({
  params,
}: {
  params: Promise<{ publicId: string }>;
}) {
  const { publicId } = await params;

  // Le chargement (seul à pouvoir lever) est isolé dans le try/catch ; la
  // construction du JSX se fait ensuite, hors du bloc (cf. règle lint
  // react-hooks/error-boundaries : une erreur de rendu ne serait pas capturée).
  let form: PublicForm;
  try {
    form = await getPublicForm(publicId);
  } catch (error) {
    if (error instanceof FormNotFoundError || error instanceof FormNotPublishedError) {
      notFound();
    }
    throw error;
  }

  return <ResponderForm form={form} />;
}
