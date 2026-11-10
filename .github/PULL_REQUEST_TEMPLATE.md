## What changed

<!-- One paragraph. Name the behavior a user or caller sees. -->

## Why

<!-- The issue or goal this serves. Link the issue. -->

## Proof

- [ ] `pnpm verify` passes (paste the tail)
- [ ] `pnpm verify:pr` passes for a UI or runtime change
- [ ] A test fails if the new behavior breaks (name it)
- [ ] UI changes include a screenshot, recording, or Playwright trace

```
# paste the relevant command output here
```

## Risk

<!-- What could break, and how to roll it back. Delete if trivial. -->

## Checklist

- [ ] The domain shape was named before the code
- [ ] New rules are at the boundary, not duplicated in the UI and the server
- [ ] No new layer (repository, DI, query cache, generic CRUD framework)
- [ ] Docs updated only where behavior or commands changed
