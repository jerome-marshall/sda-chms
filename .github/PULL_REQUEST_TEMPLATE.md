## What changed

<!-- One paragraph. Name the behavior a user or caller sees. -->

## Why

<!-- The issue or goal this serves. Link the issue. -->

## Proof

- [ ] `pnpm verify` passes locally
- [ ] `pnpm verify:pr` passes for a UI or runtime change
- [ ] The test that fails if this breaks is named below
- [ ] A UI change includes a screenshot, recording, or Playwright trace

Test that fails if this breaks: `apps/chms/test/example.test.ts`

```
# paste the relevant command output here
```

## One-way doors

None.

<!-- A migration, a deploy, a secret, an auth change, a remote seed, a change to the gate workflows, or a notification that leaves the system. Name it, or write None. -->

## Self-review

Run `docs/agents/self-review.md`. The checked half is the gate; the decided half is yours to answer above.

## Risk

<!-- What could break, and how to roll it back. Delete if trivial. -->

## Checklist

- [ ] The domain shape was named before the code
- [ ] New rules are at the boundary, not duplicated in the UI and the server
- [ ] No new layer (repository, DI, query cache, generic CRUD module)
- [ ] Docs updated only where behavior or commands changed
