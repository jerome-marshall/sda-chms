import assert from "node:assert/strict";
import test from "node:test";

import { checkProof } from "./check-proof.mjs";

const suite = "apps/chms/test/people.test.ts";

const body = ({
  extraProof = [],
  output = ["Test Files  12 passed (12)"],
  doors = ["None."],
  nameTest = true,
} = {}) => {
  const proof = [
    "- [x] `pnpm verify` passes locally",
    "- [x] UI changes include a screenshot, recording, or trace",
    ...(nameTest
      ? [
          "- [x] The test that fails if this breaks: `apps/chms/test/people.test.ts`",
        ]
      : []),
    ...extraProof,
  ];

  return [
    "## What changed",
    "",
    "People can be listed.",
    "",
    "## Proof",
    "",
    ...proof,
    "",
    "```",
    ...output,
    "```",
    "",
    "## One-way doors",
    "",
    ...doors,
    "",
    "## Checklist",
    "",
    "- [x] The domain shape was named",
  ].join("\n");
};

test("rejects an empty body", () => {
  assert.equal(checkProof({ body: "", files: [suite] }).length, 1);
});

test("rejects an unticked box", () => {
  const findings = checkProof({
    body: body({ extraProof: ["- [ ] not done"] }),
    files: [suite],
  });
  assert.equal(findings.length, 1);
  assert.match(findings[0], /unticked box/u);
});

test("rejects the template placeholder", () => {
  const findings = checkProof({
    body: body({ output: ["# paste the relevant command output here"] }),
    files: [suite],
  });
  assert.equal(findings.length, 1);
  assert.match(findings[0], /template text/u);
});

test("rejects a body that names no changed test", () => {
  const findings = checkProof({
    body: body({ nameTest: false }),
    files: [suite],
  });
  assert.equal(findings.length, 1);
  assert.match(findings[0], /names no changed test/u);
});

test("accepts a body that names the changed test", () => {
  assert.deepEqual(checkProof({ body: body(), files: [suite] }), []);
});

test("rejects a UI change with no picture", () => {
  const files = [suite, "apps/chms/src/pages/People.tsx"];
  const findings = checkProof({ body: body(), files });
  assert.equal(findings.length, 1);
  assert.match(findings[0], /no screenshot/u);
});

test("accepts a UI change with a screenshot", () => {
  const files = [suite, "apps/chms/src/pages/People.tsx"];
  const findings = checkProof({
    body: body({ output: ["![people](shot.png)"] }),
    files,
  });
  assert.deepEqual(findings, []);
});

test("rejects a schema change with no drift output", () => {
  const files = [suite, "apps/chms/src/db/migrations/1_people.sql"];
  const findings = checkProof({
    body: body({ doors: ["A migration; a person applies it."] }),
    files,
  });
  assert.equal(findings.length, 1);
  assert.match(findings[0], /db:drift/u);
});

test("rejects a one-way door left at None", () => {
  const files = [suite, ".github/workflows/test.yml"];
  const findings = checkProof({ body: body(), files });
  assert.equal(findings.length, 1);
  assert.match(findings[0], /still says None/u);
});

test("accepts a one-way door that is named", () => {
  const files = [suite, ".github/workflows/test.yml"];
  const findings = checkProof({
    body: body({ doors: ["The gate workflow changes; a person merges it."] }),
    files,
  });
  assert.deepEqual(findings, []);
});

test("rejects a one-way door with no section", () => {
  const files = [".github/workflows/test.yml"];
  const findings = checkProof({
    body: "## Proof\n\n- [x] done\n",
    files,
  });
  assert.match(findings.join("\n"), /no `## One-way doors` section/u);
});
