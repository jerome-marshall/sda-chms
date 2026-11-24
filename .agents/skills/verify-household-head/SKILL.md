---
name: verify-household-head
description: Model-check who can be a Household Head when two requests write at once. Use when a change touches Household Role or Household writes in apps/chms/server/effect/people.ts, the import, or the unique_household_head index, or when a CI `model` job fails.
---

# Verify the Household Head model

## The promise

A Household never has two Heads, even when two people save at the same time. If this breaks, the directory shows two Heads for one family, and every rule that reads "the Head" (the shared address, the family name) picks one at random.

D1 has no interactive transaction. `update` in `apps/chms/server/effect/people.ts` reads the Person and the target Household's Head, checks the rules, then writes one `db.batch`. Another request can commit between the read and the write. The service check alone cannot keep the promise. The partial unique index `unique_household_head` in `apps/chms/src/db/schema/people.ts` keeps it.

## Run it

```sh
pnpm check:models
```

It needs Java 11 or later on PATH, or `JAVA` set to a java binary (`mise install java@temurin-25` works). It downloads `tla2tools.jar` 1.7.4 once into `node_modules/.cache/tla2tools/` and checks its sha256. A run takes a few seconds. CI runs the same script in the `model` job of `.github/workflows/test.yml`.

Expected output:

```
models/household-head/HouseholdHead.cfg  holds
models/household-head/WithoutIndex.cfg  Invariant AtMostOneHead is violated
```

`WithoutIndex.cfg` turns the index off and must keep failing. It replays the race from #39: two members of a Household with no Head are both promoted, both checks pass, and both writes land. If it stops failing, the model no longer describes the code.

The real-database twin of that race is the route test "two concurrent promotions in a Household with no Head leave one Head" in `apps/chms/test/routes/api/people/[id].test.ts`. It sends two PUTs at once over the SQLite harness and expects `[200, 409]`.

## What is covered

| Model             | Code                                                                                                                  |
| ----------------- | --------------------------------------------------------------------------------------------------------------------- |
| `Validate`        | `update` in `apps/chms/server/effect/people.ts`, from `getPersonRowById` through the `getHouseholdHeadRow` check      |
| `Allowed`         | the three Head checks in that function (a Head cannot move, cannot be demoted, a Household cannot gain a second Head) |
| `Commit`          | the `db.batch` at the end of `update`                                                                                 |
| `UniqueHeadIndex` | `unique_household_head` in `apps/chms/src/db/schema/people.ts`                                                        |
| `"member"`        | every Household Role other than `head`                                                                                |

Bounds: 3 People, 2 Households, 2 concurrent requests, every starting state with at most one Head per Household. Not modeled: `add` (a new Head always gets a new Household), the import, the "new Household" branch of `update`, and every field other than role and Household.

Last confirmed against the code at commit `71a179f`. When any file in the table changed after that commit, reread the matching model action before you trust a pass. Move the commit forward only after you have confirmed that the model still describes the code.

## Read a failure

Read every TLC result with the pstack `/statechart` skill. It turns a counterexample into the shortest path in plain words.

- `HouseholdHead.cfg` fails. A change let two Heads into one Household. Each state in the trace is a request step: `Validate` is the read and check, `Commit` is the batch. Find the step where a second Head appears. If the code really allows that, it is a bug. Fix the code, not the model.
- `WithoutIndex.cfg` passes. The model changed so that it can no longer see the race. Revert the model change, or explain in the PR why the race is now impossible in the code itself.
- A modeling error looks like a trace no request could produce, such as a write that skips `Validate`. Fix the model and say so in the PR.

When a change is intended, such as a new rule or a new write path, update `Allowed` or add an action, rerun, and move the commit above.

## Open finding

`HeadKept.cfg` checks that a write never takes the Head away from a Household. It fails today, and it is not in CI:

1. Bob is a member of Household A. Household B has no Head.
2. Request 1 reads Bob as a member and checks "make Bob Head of B". It passes.
3. Request 2 reads Bob as a member and checks "move Bob to B as a child". It passes.
4. Request 1 commits. B has a Head.
5. Request 2 commits. Bob is a child again, and B has no Head.

The `HouseholdNeedsHead` check read Bob before request 1 wrote. Fixing it needs a write that fails when the row changed since the read, such as a `WHERE household_role = <read value>` guard on the update. Run it by hand with the same java and jar `pnpm check:models` uses:

```sh
cd models/household-head && java -cp ../../node_modules/.cache/tla2tools/1.7.4/tla2tools.jar tlc2.TLC -config HeadKept.cfg HouseholdHead.tla
```
