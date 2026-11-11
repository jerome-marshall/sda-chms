## Start here

- Building a feature: `docs/agents/feature-loop.md`.
- Verify before handing back: `pnpm verify`. For a PR with UI proof:
  `pnpm verify:pr`.
- Domain vocabulary: `CONTEXT.md`. Decisions: `docs/adr/`. Area conventions:
  `.cursor/rules/`.
- Server rule changes: `docs/agents/effect-slice.md`.

### Issue tracker

Issues are tracked in this repo's GitHub Issues via the `gh` CLI. External PRs are not a triage surface. See `docs/agents/issue-tracker.md`.

### Triage labels

Default canonical label vocabulary (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `CONTEXT.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.
