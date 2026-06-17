import {
  applyReorder,
  canClose,
  canPublish,
  canTransition,
  toCreateData,
  toQuestionsReplacement,
  toScalarUpdate,
} from "@/backend/form/formMapper";
import type { CreateFormInput, UpdateFormInput } from "@/shared/schemas";

// Tests unitaires (backend) — logique PURE de la couche Form (mapping + règles).
// Aucune dépendance à Prisma / base de données : on ne teste que des fixtures.

// --- toCreateData -----------------------------------------------------------

describe("toCreateData (unitaire)", () => {
  const baseInput: CreateFormInput = {
    title: "Inscription event",
    description: "Quelques questions",
    questions: [
      {
        label: "Votre prénom ?",
        type: "SHORT_TEXT",
        required: true,
        order: 5, // valeur volontairement « fausse » : doit être réindexée
        options: [],
      },
      {
        label: "Votre couleur préférée ?",
        type: "SINGLE_CHOICE",
        required: false,
        order: 2,
        options: [
          { label: "Bleu", order: 9 },
          { label: "Rouge", order: 0 },
        ],
      },
    ],
  };

  it("réindexe les `order` des questions selon leur position (0..n)", () => {
    const data = toCreateData(baseInput);
    const orders = data.questions.create.map((q) => q.order);
    expect(orders).toEqual([0, 1]);
  });

  it("réindexe les `order` des options selon leur position", () => {
    const data = toCreateData(baseInput);
    const optionOrders = data.questions.create[1].options.create.map(
      (o) => o.order,
    );
    expect(optionOrders).toEqual([0, 1]);
  });

  it("conserve les libellés et types des questions et options", () => {
    const data = toCreateData(baseInput);
    expect(data.questions.create[1]).toMatchObject({
      label: "Votre couleur préférée ?",
      type: "SINGLE_CHOICE",
      required: false,
    });
    expect(data.questions.create[1].options.create.map((o) => o.label)).toEqual([
      "Bleu",
      "Rouge",
    ]);
  });

  it("normalise une description absente en null", () => {
    const data = toCreateData({
      title: "Sans description",
      questions: [baseInput.questions[0]],
    } as CreateFormInput);
    expect(data.description).toBeNull();
  });

  it("marque la provenance IA quand demandé", () => {
    const data = toCreateData(baseInput, {
      generatedByAi: true,
      aiPrompt: "un quiz sur l'IA",
    });
    expect(data.generatedByAi).toBe(true);
    expect(data.aiPrompt).toBe("un quiz sur l'IA");
  });

  it("crée un questionnaire manuel sans provenance IA par défaut", () => {
    const data = toCreateData(baseInput);
    expect(data.generatedByAi).toBe(false);
    expect(data.aiPrompt).toBeNull();
  });
});

// --- toScalarUpdate / toQuestionsReplacement --------------------------------

describe("toScalarUpdate (unitaire)", () => {
  it("n'inclut que les champs scalaires fournis", () => {
    const update = toScalarUpdate({ title: "Nouveau titre" } as UpdateFormInput);
    expect(update).toEqual({ title: "Nouveau titre" });
  });

  it("transmet le statut et la description", () => {
    const update = toScalarUpdate({
      description: "MAJ",
      status: "PUBLISHED",
    } as UpdateFormInput);
    expect(update).toEqual({ description: "MAJ", status: "PUBLISHED" });
  });

  it("ignore les questions (gérées séparément)", () => {
    const update = toScalarUpdate({
      title: "T",
      questions: [
        { label: "Q", type: "SHORT_TEXT", required: false, order: 0, options: [] },
      ],
    } as UpdateFormInput);
    expect(update).not.toHaveProperty("questions");
  });
});

describe("toQuestionsReplacement (unitaire)", () => {
  it("renvoie null quand l'entrée ne touche pas aux questions", () => {
    expect(toQuestionsReplacement({ title: "T" } as UpdateFormInput)).toBeNull();
  });

  it("réindexe les `order` des questions de remplacement", () => {
    const questions = toQuestionsReplacement({
      questions: [
        { label: "A", type: "SHORT_TEXT", required: false, order: 7, options: [] },
        { label: "B", type: "LONG_TEXT", required: true, order: 3, options: [] },
      ],
    } as UpdateFormInput);
    expect(questions?.map((q) => q.order)).toEqual([0, 1]);
  });
});

// --- Transitions de statut --------------------------------------------------

describe("transitions de statut (unitaire)", () => {
  it("autorise DRAFT → PUBLISHED", () => {
    expect(canTransition("DRAFT", "PUBLISHED")).toBe(true);
    expect(canPublish("DRAFT")).toBe(true);
  });

  it("autorise PUBLISHED → CLOSED", () => {
    expect(canTransition("PUBLISHED", "CLOSED")).toBe(true);
    expect(canClose("PUBLISHED")).toBe(true);
  });

  it("interdit la publication d'un questionnaire déjà publié ou clôturé", () => {
    expect(canPublish("PUBLISHED")).toBe(false);
    expect(canPublish("CLOSED")).toBe(false);
  });

  it("interdit la clôture d'un brouillon", () => {
    expect(canClose("DRAFT")).toBe(false);
  });

  it("interdit toute transition depuis CLOSED (état terminal)", () => {
    expect(canTransition("CLOSED", "PUBLISHED")).toBe(false);
    expect(canTransition("CLOSED", "DRAFT")).toBe(false);
  });

  it("interdit un retour en arrière (PUBLISHED → DRAFT)", () => {
    expect(canTransition("PUBLISHED", "DRAFT")).toBe(false);
  });
});

// --- applyReorder -----------------------------------------------------------

describe("applyReorder (unitaire)", () => {
  const items = [
    { id: "a", order: 0 },
    { id: "b", order: 1 },
    { id: "c", order: 2 },
  ];

  it("réordonne les éléments selon la liste d'identifiants", () => {
    const result = applyReorder(items, ["c", "a", "b"]);
    expect(result.map((i) => i.id)).toEqual(["c", "a", "b"]);
    expect(result.map((i) => i.order)).toEqual([0, 1, 2]);
  });

  it("renvoie une liste triée par `order` croissant", () => {
    const result = applyReorder(items, ["b", "c", "a"]);
    expect(result.map((i) => i.order)).toEqual([0, 1, 2]);
    expect(result[0].id).toBe("b");
  });

  it("rejette une liste partielle (identifiant manquant)", () => {
    expect(() => applyReorder(items, ["a", "b"])).toThrow();
  });

  it("rejette un identifiant inconnu", () => {
    expect(() => applyReorder(items, ["a", "b", "z"])).toThrow();
  });

  it("ne mute pas la collection d'origine", () => {
    const snapshot = items.map((i) => ({ ...i }));
    applyReorder(items, ["c", "b", "a"]);
    expect(items).toEqual(snapshot);
  });
});
