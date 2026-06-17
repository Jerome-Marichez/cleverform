# Storybook

**Storybook** est utilisé comme surface de **rendu et de documentation** des composants de
l'interface (`src/frontend/components/`). Pour le moment, il sert **uniquement à visualiser** les
composants — ce **n'est pas** un outil de test ici (les tests sont gérés par **Jest** pour
l'unitaire/intégration et **Cypress** pour l'e2e, voir [`testing.md`](./testing.md)).

## Lancer Storybook

```bash
make storybook        # ou : npm run storybook   (port 6006)
make build-storybook  # ou : npm run build-storybook (build statique)
```

## Organisation

- **Framework** : `@storybook/nextjs` (intégration Next.js + SWC).
- **Stories co-localisées** avec les composants : `src/frontend/**/*.stories.tsx`.
- Une story par composant (CSF 3) : `Meta` + `StoryObj` importés depuis **`@storybook/nextjs`**
  (et non `@storybook/react` directement — règle `storybook/no-renderer-packages`).

```tsx
import type { Meta, StoryObj } from "@storybook/nextjs";
import { MonComposant } from "./MonComposant";

const meta = {
  title: "Catégorie/MonComposant",
  component: MonComposant,
} satisfies Meta<typeof MonComposant>;
export default meta;

type Story = StoryObj<typeof meta>;
export const Defaut: Story = {};
```

## Thème clair / sombre

Le décorateur global (`.storybook/preview.tsx`) enveloppe chaque story dans le **thème MUI** de
l'application (`src/frontend/theme.ts`) avec `CssBaseline`. Une **barre d'outils « Thème »** permet
de basculer **clair / sombre** : chaque composant doit donc être vérifié dans les **deux modes**.

## Conventions

- Commentaires et titres en **français**.
- Le build statique (`storybook-static/`) est **ignoré** par Git.
- Les fichiers Storybook (stories + `.storybook/`) sont couverts par ESLint
  (`eslint-plugin-storybook`, config `flat/recommended`).
