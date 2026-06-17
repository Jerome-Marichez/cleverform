import { act, renderHook } from "@testing-library/react";
import {
  createQuestion,
  moveItem,
  toUpdatePayload,
  useFormBuilder,
  validateBuilder,
  type BuilderQuestion,
  type FormBuilderInitialData,
} from "@/frontend/hooks/useFormBuilder";

// Tests unitaires du hook useFormBuilder et de sa logique PURE (sans DB ni réseau) :
// ajout / suppression / mise à jour / réordonnancement, réindexation des `order`,
// et contrainte d'options pour les types à choix.

const INITIAL: FormBuilderInitialData = {
  title: "Mon questionnaire",
  description: "Description",
  questions: [
    { label: "Prénom ?", type: "SHORT_TEXT", required: true, options: [] },
    {
      label: "Couleur ?",
      type: "SINGLE_CHOICE",
      required: false,
      options: [{ label: "Bleu" }, { label: "Rouge" }],
    },
  ],
};

// --- Fonctions pures --------------------------------------------------------

describe("moveItem (pur)", () => {
  it("déplace un élément vers le bas", () => {
    expect(moveItem([1, 2, 3], 0, 2)).toEqual([2, 3, 1]);
  });

  it("déplace un élément vers le haut", () => {
    expect(moveItem(["a", "b", "c"], 2, 0)).toEqual(["c", "a", "b"]);
  });

  it("renvoie une copie inchangée si les index sont identiques ou hors bornes", () => {
    expect(moveItem([1, 2, 3], 1, 1)).toEqual([1, 2, 3]);
    expect(moveItem([1, 2, 3], 0, 5)).toEqual([1, 2, 3]);
  });
});

describe("createQuestion (pur)", () => {
  it("crée une question vide sans option pour un type simple", () => {
    const question = createQuestion("SHORT_TEXT");
    expect(question.label).toBe("");
    expect(question.required).toBe(false);
    expect(question.options).toHaveLength(0);
  });

  it("crée une option par défaut pour un type à choix", () => {
    const question = createQuestion("MULTIPLE_CHOICE");
    expect(question.options).toHaveLength(1);
    expect(question.options[0].label).toBe("");
  });
});

describe("toUpdatePayload (pur)", () => {
  const questions: BuilderQuestion[] = [
    { localId: "q1", label: "  Prénom ?  ", type: "SHORT_TEXT", required: true, options: [] },
    {
      localId: "q2",
      label: "Couleur ?",
      type: "SINGLE_CHOICE",
      required: false,
      options: [
        { localId: "o1", label: " Bleu " },
        { localId: "o2", label: "Rouge" },
      ],
    },
  ];

  it("réindexe les order des questions et options selon leur position", () => {
    const payload = toUpdatePayload("Titre", "", questions);
    expect(payload.questions.map((q) => q.order)).toEqual([0, 1]);
    expect(payload.questions[1].options.map((o) => o.order)).toEqual([0, 1]);
  });

  it("rogne les libellés (trim)", () => {
    const payload = toUpdatePayload(" Titre ", "", questions);
    expect(payload.title).toBe("Titre");
    expect(payload.questions[0].label).toBe("Prénom ?");
    expect(payload.questions[1].options[0].label).toBe("Bleu");
  });

  it("omet la description quand elle est vide", () => {
    expect(toUpdatePayload("Titre", "   ", questions).description).toBeUndefined();
    expect(toUpdatePayload("Titre", "Bonjour", questions).description).toBe("Bonjour");
  });

  it("n'inclut pas d'options pour les types non-choix", () => {
    expect(toUpdatePayload("Titre", "", questions).questions[0].options).toEqual([]);
  });
});

describe("validateBuilder (pur)", () => {
  const valid: BuilderQuestion[] = [
    { localId: "q1", label: "Prénom ?", type: "SHORT_TEXT", required: true, options: [] },
    {
      localId: "q2",
      label: "Couleur ?",
      type: "SINGLE_CHOICE",
      required: false,
      options: [{ localId: "o1", label: "Bleu" }],
    },
  ];

  it("accepte un état valide", () => {
    expect(validateBuilder("Titre", valid)).toBeNull();
  });

  it("refuse un titre vide", () => {
    expect(validateBuilder("   ", valid)?.message).toMatch(/titre/i);
  });

  it("refuse une liste de questions vide", () => {
    expect(validateBuilder("Titre", [])?.message).toMatch(/au moins une question/i);
  });

  it("refuse une question sans libellé", () => {
    const questions: BuilderQuestion[] = [
      { localId: "q1", label: "  ", type: "SHORT_TEXT", required: false, options: [] },
    ];
    expect(validateBuilder("Titre", questions)?.message).toMatch(/libellé/i);
  });

  it("refuse une question à choix sans option remplie", () => {
    const questions: BuilderQuestion[] = [
      {
        localId: "q1",
        label: "Couleur ?",
        type: "SINGLE_CHOICE",
        required: false,
        options: [{ localId: "o1", label: "  " }],
      },
    ];
    expect(validateBuilder("Titre", questions)?.message).toMatch(/option/i);
  });
});

// --- Hook -------------------------------------------------------------------

describe("useFormBuilder (état local)", () => {
  it("initialise titre, description et questions", () => {
    const { result } = renderHook(() => useFormBuilder(INITIAL));
    expect(result.current.title).toBe("Mon questionnaire");
    expect(result.current.description).toBe("Description");
    expect(result.current.questions).toHaveLength(2);
    expect(result.current.questions[1].options).toHaveLength(2);
  });

  it("ajoute une question à la fin", () => {
    const { result } = renderHook(() => useFormBuilder(INITIAL));
    act(() => result.current.addQuestion("EMAIL"));
    expect(result.current.questions).toHaveLength(3);
    expect(result.current.questions[2].type).toBe("EMAIL");
  });

  it("supprime une question par son identifiant local", () => {
    const { result } = renderHook(() => useFormBuilder(INITIAL));
    const target = result.current.questions[0].localId;
    act(() => result.current.removeQuestion(target));
    expect(result.current.questions).toHaveLength(1);
    expect(result.current.questions[0].label).toBe("Couleur ?");
  });

  it("met à jour le libellé et le caractère obligatoire d'une question", () => {
    const { result } = renderHook(() => useFormBuilder(INITIAL));
    const target = result.current.questions[0].localId;
    act(() => result.current.updateQuestionLabel(target, "Nom ?"));
    act(() => result.current.toggleQuestionRequired(target, false));
    expect(result.current.questions[0].label).toBe("Nom ?");
    expect(result.current.questions[0].required).toBe(false);
  });

  it("réordonne les questions et réindexe les order dans le payload", () => {
    const { result } = renderHook(() => useFormBuilder(INITIAL));
    act(() => result.current.reorderQuestions(0, 1));
    expect(result.current.questions[0].label).toBe("Couleur ?");
    const payload = result.current.buildPayload();
    expect(payload.questions.map((q) => q.order)).toEqual([0, 1]);
    expect(payload.questions[0].label).toBe("Couleur ?");
  });

  it("ajoute, met à jour et supprime des options sur une question à choix", () => {
    const { result } = renderHook(() => useFormBuilder(INITIAL));
    const target = result.current.questions[1].localId;

    act(() => result.current.addOption(target));
    expect(result.current.questions[1].options).toHaveLength(3);

    const optionId = result.current.questions[1].options[2].localId;
    act(() => result.current.updateOptionLabel(target, optionId, "Vert"));
    expect(result.current.questions[1].options[2].label).toBe("Vert");

    act(() => result.current.removeOption(target, optionId));
    expect(result.current.questions[1].options).toHaveLength(2);
  });

  it("réordonne les options d'une question", () => {
    const { result } = renderHook(() => useFormBuilder(INITIAL));
    const target = result.current.questions[1].localId;
    act(() => result.current.reorderOptions(target, 0, 1));
    expect(result.current.questions[1].options.map((o) => o.label)).toEqual([
      "Rouge",
      "Bleu",
    ]);
  });

  it("expose une validation cohérente avec l'état courant", () => {
    const { result } = renderHook(() => useFormBuilder(INITIAL));
    expect(result.current.validate()).toBeNull();
    act(() => result.current.setTitle(""));
    expect(result.current.validate()?.message).toMatch(/titre/i);
  });
});
