import {
  cleanProofreadOutput,
  extractGeneratedForm,
  toCreateFormInput,
} from "@/backend/ai/aiMapper";
import { AiGenerationError } from "@/backend/ai/aiErrors";
import type { GeneratedForm } from "@/shared/schemas";

// Tests unitaires (backend) — logique PURE de la couche IA (extraction /
// validation / mapping / nettoyage), isolée dans `aiMapper.ts`. AUCUN appel
// réseau, AUCUNE clé API, AUCUNE base : on importe le module pur (qui ne tire
// pas la connexion Prisma) et on ne teste que des FIXTURES (sorties IA simulées
// sous forme de données). Voir docs/testing.md.

// --- extractGeneratedForm ---------------------------------------------------

describe("extractGeneratedForm (unitaire)", () => {
  // Fixture : un questionnaire valide minimal (JSON nu).
  const validForm = {
    title: "Soirée IA",
    description: "Quelques questions pour notre événement.",
    questions: [
      { label: "Votre prénom ?", type: "SHORT_TEXT", required: true },
      {
        label: "Votre niveau en IA ?",
        type: "SINGLE_CHOICE",
        required: false,
        options: ["Débutant", "Intermédiaire", "Avancé"],
      },
    ],
  };

  it("extrait et valide un JSON propre (réponse nue)", () => {
    const result = extractGeneratedForm(JSON.stringify(validForm));
    expect(result.title).toBe("Soirée IA");
    expect(result.questions).toHaveLength(2);
    expect(result.questions[1].options).toEqual([
      "Débutant",
      "Intermédiaire",
      "Avancé",
    ]);
  });

  it("tolère un JSON encadré par des fences ```json", () => {
    const fenced = "```json\n" + JSON.stringify(validForm) + "\n```";
    const result = extractGeneratedForm(fenced);
    expect(result.title).toBe("Soirée IA");
  });

  it("tolère des fences sans langage et du texte parasite autour", () => {
    const raw =
      "Voici le questionnaire :\n```\n" +
      JSON.stringify(validForm) +
      "\n```\nBonne soirée !";
    const result = extractGeneratedForm(raw);
    expect(result.questions).toHaveLength(2);
  });

  it("applique la valeur par défaut required=false quand le champ est absent", () => {
    const raw = JSON.stringify({
      title: "Sans required",
      questions: [{ label: "Une question", type: "SHORT_TEXT" }],
    });
    const result = extractGeneratedForm(raw);
    expect(result.questions[0].required).toBe(false);
  });

  it("lève AiGenerationError quand aucun JSON n'est présent", () => {
    expect(() => extractGeneratedForm("Désolé, je ne peux pas répondre.")).toThrow(
      AiGenerationError,
    );
  });

  it("lève AiGenerationError sur un JSON syntaxiquement invalide", () => {
    expect(() => extractGeneratedForm('{ "title": "X", ')).toThrow(
      AiGenerationError,
    );
  });

  it("lève AiGenerationError quand la liste de questions est vide", () => {
    const raw = JSON.stringify({ title: "Vide", questions: [] });
    expect(() => extractGeneratedForm(raw)).toThrow(AiGenerationError);
  });

  it("lève AiGenerationError sur un type de question inconnu", () => {
    const raw = JSON.stringify({
      title: "Type inconnu",
      questions: [{ label: "Q", type: "SLIDER", required: false }],
    });
    expect(() => extractGeneratedForm(raw)).toThrow(AiGenerationError);
  });

  it("lève AiGenerationError quand le titre est manquant", () => {
    const raw = JSON.stringify({
      questions: [{ label: "Q", type: "SHORT_TEXT", required: false }],
    });
    expect(() => extractGeneratedForm(raw)).toThrow(AiGenerationError);
  });
});

// --- toCreateFormInput ------------------------------------------------------

describe("toCreateFormInput (unitaire)", () => {
  const generated: GeneratedForm = {
    title: "Soirée IA",
    description: "Description",
    questions: [
      { label: "Prénom ?", type: "SHORT_TEXT", required: true, options: undefined },
      {
        label: "Niveau ?",
        type: "SINGLE_CHOICE",
        required: false,
        options: ["Débutant", "Avancé"],
      },
    ],
  };

  it("attribue un `order` séquentiel aux questions (0..n)", () => {
    const input = toCreateFormInput(generated);
    expect(input.questions.map((q) => q.order)).toEqual([0, 1]);
  });

  it("convertit options string[] en objets { label, order }", () => {
    const input = toCreateFormInput(generated);
    expect(input.questions[1].options).toEqual([
      { label: "Débutant", order: 0 },
      { label: "Avancé", order: 1 },
    ]);
  });

  it("n'attache pas d'options aux types sans choix", () => {
    const input = toCreateFormInput(generated);
    expect(input.questions[0].options).toEqual([]);
  });

  it("ignore des options fournies par erreur sur un type sans choix", () => {
    const withStrayOptions: GeneratedForm = {
      title: "T",
      questions: [
        {
          label: "Note ?",
          type: "RATING",
          required: false,
          options: ["1", "2", "3"],
        },
      ],
    };
    const input = toCreateFormInput(withStrayOptions);
    expect(input.questions[0].options).toEqual([]);
  });

  it("conserve titre, description, libellés, types et required", () => {
    const input = toCreateFormInput(generated);
    expect(input.title).toBe("Soirée IA");
    expect(input.description).toBe("Description");
    expect(input.questions[0]).toMatchObject({
      label: "Prénom ?",
      type: "SHORT_TEXT",
      required: true,
    });
  });

  it("omet la description quand elle est absente", () => {
    const input = toCreateFormInput({
      title: "Sans description",
      questions: [{ label: "Q", type: "SHORT_TEXT", required: false }],
    });
    expect(input.description).toBeUndefined();
  });
});

// --- cleanProofreadOutput ---------------------------------------------------

describe("cleanProofreadOutput (unitaire)", () => {
  it("rogne les espaces de début et de fin", () => {
    expect(cleanProofreadOutput("  Bonjour le monde  ")).toBe(
      "Bonjour le monde",
    );
  });

  it("retire une paire de guillemets droits entourant le texte", () => {
    expect(cleanProofreadOutput('"Bonjour le monde"')).toBe("Bonjour le monde");
  });

  it("retire une paire de guillemets typographiques français", () => {
    expect(cleanProofreadOutput("« Bonjour »".replace(/ /g, ""))).toBe(
      "Bonjour",
    );
  });

  it("retire des guillemets courbes anglais", () => {
    expect(cleanProofreadOutput("“Bonjour”")).toBe("Bonjour");
  });

  it("ne retire pas un guillemet présent uniquement à l'intérieur", () => {
    expect(cleanProofreadOutput('Le mot "test" est correct.')).toBe(
      'Le mot "test" est correct.',
    );
  });

  it("renvoie une chaîne vide pour une entrée vide ou blanche", () => {
    expect(cleanProofreadOutput("   ")).toBe("");
  });

  it("laisse un texte propre inchangé", () => {
    expect(cleanProofreadOutput("Quel est votre prénom ?")).toBe(
      "Quel est votre prénom ?",
    );
  });
});
