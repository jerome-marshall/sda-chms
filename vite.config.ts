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
    projects: [
      "apps/server/vite.config.ts",
      "apps/web/vite.config.ts",
      "packages/db/vite.config.ts",
      "packages/shared/vite.config.ts",
    ],
  },
  fmt: {
    ...oxfmtPreset,
    // Biome's useSortedClasses equivalent: sort Tailwind classes on format.
    sortTailwindcss: {
      stylesheet: "./apps/web/src/index.css",
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
      "no-unused-vars": "warn",
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
      // consistent-return requires explicit `return undefined`, which
      // unicorn/no-useless-undefined then flags; explicitness wins.
      "unicorn/no-useless-undefined": "off",
      // The repo's most intricate UI logic sits at 28 today; the gate
      // stays to catch future growth past that, not to force a rewrite.
      complexity: ["error", 30],
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
    // route tree and web static assets stay out of lint.
    ignorePatterns: ["**/routeTree.gen.ts", "apps/web/public/**"],
    options: { typeAware: true, typeCheck: true },
  },
  staged: {
    "*": ["vp check --fix", () => "vp run check-types"],
  },
  run: {
    tasks: {
      // `dev` orchestration lives here (not in package.json scripts) so the
      // two servers start together with one dependency graph. Script `dev`
      // runs the `dev:servers` task; run one tier with `vpr dev:web` /
      // `vpr dev:server`.
      "dev:web": { command: "vp -C apps/web run dev", cache: false },
      "dev:server": { command: "vp -C apps/server run dev", cache: false },
      "dev:servers": {
        command: "echo web and server dev running",
        dependsOn: ["dev:web", "dev:server"],
        cache: false,
      },
      // Local equivalent of the CI test job, steps in order.
      verify: ["vp run -r check-types", "vp check", "vp test run"],
    },
  },
});
