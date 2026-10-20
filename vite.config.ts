import oxfmtPreset from "ultracite/oxfmt";
import core from "ultracite/oxlint/core";
import react from "ultracite/oxlint/react";
import vitestBase from "ultracite/oxlint/vitest";
import { defineConfig } from "vite-plus";

// The vitest preset enables prefer-to-be-truthy/falsy inside its own
// test-file override, which wins over base rules for test files, so the
// carve-out is applied to a copy of the preset: weakening strict
// assertions is not an upgrade.
const vitest = structuredClone(vitestBase);
for (const override of vitest.overrides ?? []) {
  for (const rule of [
    "vitest/prefer-to-be-truthy",
    "vitest/prefer-to-be-falsy",
  ] as const) {
    if (override.rules?.[rule] !== undefined) {
      override.rules[rule] = "off";
    }
  }
}

export default defineConfig({
  test: {
    projects: ["apps/chms/vite.config.ts", "packages/shared/vite.config.ts"],
  },
  fmt: {
    ...oxfmtPreset,
    // Biome's useSortedClasses equivalent: sort Tailwind classes on format.
    sortTailwindcss: {
      stylesheet: "./apps/chms/src/index.css",
      functions: ["cn", "clsx"],
    },
    ignorePatterns: [
      ...(oxfmtPreset.ignorePatterns ?? []),
      "**/routeTree.gen.ts",
    ],
  },
  lint: {
    extends: [core, react, vitest],
    jsPlugins: [{ name: "vite-plus", specifier: "vite-plus/oxlint-plugin" }],
    rules: {
      "vite-plus/prefer-vite-plus-imports": "error",
      // Biome parity: these were warnings under ultracite/biome, kept as
      // warnings where Oxlint has an equivalent rule.
      "no-unused-vars": [
        "error",
        { args: "after-used", argsIgnorePattern: "^_" },
      ],
      "no-unreachable": "error",
      "import/no-namespace": "warn",
      "oxc/no-barrel-file": "warn",
      "react/no-danger": "warn",
      // Main-parity errors: these were errors under ultracite/biome on
      // main (react correctness plus the hook rules), so they stay errors.
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "error",
      "react/jsx-key": "error",
      "react/no-array-index-key": "error",
      "react/button-has-type": "error",
      "react/no-children-prop": "error",
      "react/jsx-no-duplicate-props": "error",
      "react/no-render-return-value": "error",
      "react/void-dom-elements-no-children": "error",
      // Main-parity a11y errors: the jsx-a11y equivalents of main's
      // error-level Biome a11y rules (checked against main's biome.json
      // downgrades, which stay). Oxlint has no rule for noSvgWithoutTitle.
      "jsx-a11y/alt-text": "error",
      "jsx-a11y/aria-activedescendant-has-tabindex": "error",
      "jsx-a11y/aria-props": "error",
      "jsx-a11y/aria-proptypes": "error",
      "jsx-a11y/aria-role": "error",
      "jsx-a11y/aria-unsupported-elements": "error",
      "jsx-a11y/anchor-has-content": "error",
      "jsx-a11y/anchor-is-valid": "error",
      "jsx-a11y/autocomplete-valid": "error",
      "jsx-a11y/heading-has-content": "error",
      "jsx-a11y/html-has-lang": "error",
      "jsx-a11y/iframe-has-title": "error",
      "jsx-a11y/img-redundant-alt": "error",
      "jsx-a11y/label-has-associated-control": "error",
      "jsx-a11y/lang": "error",
      "jsx-a11y/media-has-caption": "error",
      "jsx-a11y/mouse-events-have-key-events": "error",
      "jsx-a11y/no-access-key": "error",
      "jsx-a11y/no-aria-hidden-on-focusable": "error",
      "jsx-a11y/no-distracting-elements": "error",
      "jsx-a11y/no-noninteractive-tabindex": "error",
      "jsx-a11y/no-redundant-roles": "error",
      "jsx-a11y/no-static-element-interactions": "error",
      "jsx-a11y/role-supports-aria-props": "error",
      "jsx-a11y/scope": "error",
      "jsx-a11y/tabindex-no-positive": "error",
      // Main had useFocusableInteractive at warn, so this stays warn.
      "jsx-a11y/interactive-supports-focus": "warn",
      // Main had useKeyWithClickEvents off, so this stays off.
      "jsx-a11y/click-events-have-key-events": "off",
      // House-style conflicts: the repo predates these Ultracite Oxlint
      // rules and follows the opposite convention throughout. Fixing them
      // would rewrite every file, so they stay off (see trail for the
      // per-rule reason). Correctness rules from the presets stay on.
      "func-style": "off",
      "sort-keys": "off",
      "typescript/strict-boolean-expressions": "off",
      "typescript/prefer-nullish-coalescing": "off",
      "no-inline-comments": "off",
      "no-use-before-define": "off",
      "no-confusing-void-expression": "off",
      "typescript/promise-function-async": "off",
      "no-await-expression-member": "off",
      "prefer-destructuring": "off",
      "promise/prefer-await-to-then": "off",
      "no-plusplus": "off",
      "vitest/prefer-to-be-truthy": "off",
      "vitest/prefer-to-be-falsy": "off",
      // One-off scripts, seed/backfill loops and transactional use-cases
      // await sequentially on purpose (ordering and failure semantics
      // matter); Promise.all would change behavior.
      "no-await-in-loop": "off",
      // consistent-return requires explicit `return undefined`, which the
      // main-parity unicorn/no-useless-undefined then flags; the main rule
      // wins and consistent-return stays off.
      "typescript/consistent-return": "off",
      // Main had a cognitive-complexity cap of 20; Oxlint only offers
      // cyclomatic complexity, set to the same value.
      complexity: ["error", 20],
      // The repo validates at boundaries with Zod and narrows with `as`
      // casts afterwards. Removing every assertion would restructure
      // dozens of call sites, so the no-unsafe family stays off.
      "typescript/no-unsafe-type-assertion": "off",
      "typescript/no-unsafe-assignment": "off",
      "typescript/no-unsafe-call": "off",
      "typescript/no-unsafe-member-access": "off",
      "typescript/no-unsafe-argument": "off",
      "typescript/no-unsafe-return": "off",
    },
    // Biome's file ignore list, where Oxlint has an equivalent: generated
    // route tree and web static assets stay out of lint. Bracket files are
    // Void dynamic route segments ([id], [personId]) — kebab-case renames
    // would break file-based routing.
    ignorePatterns: ["**/routeTree.gen.ts", "apps/chms/public/**", "**/*\\[*"],
    options: { typeAware: true, typeCheck: true },
  },
  staged: {
    "*": ["vp check --fix", () => "vp run check-types"],
  },
  run: {
    tasks: {
      // Same drift gate CI runs: regenerate migrations, then fail on schema drift.
      "db:drift": {
        command: [
          "pnpm run db:generate",
          "git diff --exit-code -- apps/chms/db",
        ],
        cache: false,
      },
      // Local equivalent of the CI test job, steps in order.
      verify: [
        "vp run -r check-types",
        "vp check",
        "vp run db:drift",
        "vp test run",
      ],
    },
  },
});
