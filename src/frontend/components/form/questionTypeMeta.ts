import type { QuestionType } from "@/shared/schemas/form";
import type { SvgIconComponent } from "@mui/icons-material";
import ShortTextIcon from "@mui/icons-material/ShortTextOutlined";
import NotesIcon from "@mui/icons-material/NotesOutlined";
import RadioIcon from "@mui/icons-material/RadioButtonCheckedOutlined";
import CheckBoxIcon from "@mui/icons-material/CheckBoxOutlined";
import StarIcon from "@mui/icons-material/StarOutlineOutlined";
import NumbersIcon from "@mui/icons-material/NumbersOutlined";
import EmailIcon from "@mui/icons-material/EmailOutlined";
import EventIcon from "@mui/icons-material/EventOutlined";

export interface QuestionTypeMeta {
  /** Libellé lisible (français). */
  label: string;
  /** Icône MUI associée au type. */
  Icon: SvgIconComponent;
}

// Métadonnées de présentation par type de question. Réutilise l'enum
// `QuestionType` de la couche partagée (pas de duplication). Voir docs/data-model.md.
export const questionTypeMeta: Record<QuestionType, QuestionTypeMeta> = {
  SHORT_TEXT: { label: "Texte court", Icon: ShortTextIcon },
  LONG_TEXT: { label: "Texte long", Icon: NotesIcon },
  SINGLE_CHOICE: { label: "Choix unique", Icon: RadioIcon },
  MULTIPLE_CHOICE: { label: "Choix multiple", Icon: CheckBoxIcon },
  RATING: { label: "Note", Icon: StarIcon },
  NUMBER: { label: "Nombre", Icon: NumbersIcon },
  EMAIL: { label: "E-mail", Icon: EmailIcon },
  DATE: { label: "Date", Icon: EventIcon },
};
