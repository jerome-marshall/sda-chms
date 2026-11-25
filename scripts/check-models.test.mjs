import assert from "node:assert/strict";
import test from "node:test";

import { checks, verdict } from "./check-models.mjs";

const passing = "Model checking completed. No error has been found.";
const replay = checks.find((check) => check.expect !== "pass");
const holds = checks.find((check) => check.expect === "pass");

test("keeps at least one config that replays a past bug", () => {
  assert.ok(replay);
  assert.ok(holds);
});

test("fails a config that must hold when TLC finds an error", () => {
  assert.match(
    verdict(holds, "Error: Invariant AtMostOneHead is violated."),
    /must pass/u
  );
  assert.equal(verdict(holds, passing), null);
});

test("fails a replay config when the bug is no longer found", () => {
  assert.match(verdict(replay, passing), /no longer catches/u);
  assert.equal(verdict(replay, `Error: ${replay.expect}.`), null);
});
