# TASK

Address the human review feedback on pull request #{{PR}} (branch `{{BRANCH}}`).

The branch is already checked out. Make the changes the reviewer asked for, keep
the PR green, and reply to the feedback. Do NOT merge the PR and do NOT close it.

# THE FEEDBACK

## PR description and conversation

!`gh pr view {{PR}} --json title,body,comments,reviews --jq '{title, body, conversation: [.comments[] | {author: .author.login, body}], reviews: [.reviews[] | {author: .author.login, state, body}]}'`

## Inline review comments (code-line threads)

!`gh api repos/{owner}/{repo}/pulls/{{PR}}/comments --jq '[.[] | {id, path, line, author: .user.login, body, in_reply_to_id}]'`

# DOMAIN DOCS (read before changing code)

Follow `docs/agents/domain.md` first (it points you at `CONTEXT.md` and the
relevant `docs/adr/*`) so your changes respect the domain model and prior
decisions — not just the literal wording of a comment.

# CONTEXT

## What this PR currently changes

!`git diff {{TARGET_BRANCH}}...{{BRANCH}}`

# HOW TO RESPOND TO FEEDBACK

Triage each comment:

- **Actionable** (a change is requested): make the change. If you're adding or
  altering behaviour, do it test-first (RGR) — prefer an integration test using
  the PGlite `getDb`/`setTestDb` seam over a mock.
- **A question**: answer it in a reply; change code only if the answer implies one.
- **Out of scope / you disagree**: don't silently ignore it. Reply explaining why,
  and leave it for the human to decide.

Do not make unrequested changes beyond what the feedback calls for.

# FEEDBACK LOOPS

This is a Bun + Turborepo monorepo (no `npm`). Before committing, run and pass:

1. `bun run check-types`
2. `bun run test`
3. `bun run check`

# DATABASE SAFETY

A throwaway Postgres runs locally in this sandbox and `DATABASE_URL` already
points at it. NEVER point `DATABASE_URL` at a cloud/production database, and never
run `bun run db:start` (docker compose is unavailable). Headless Playwright E2E is
allowed: `bun run db:push` then `bun run test:e2e`, targeting the local DB only.

# COMMIT

Make one or more focused git commits. Each commit message must:

1. Start with the `RALPH:` prefix
2. Reference PR #{{PR}} and which feedback it addresses
3. Note key decisions and files changed

Do NOT push — the orchestrator pushes the branch for you after this run, which
updates the PR automatically.

# REPLY TO THE REVIEWER

After committing, reply so the reviewer knows what happened:

- For inline threads, reply to the specific comment:
  `gh api -X POST repos/{owner}/{repo}/pulls/{{PR}}/comments/<COMMENT_ID>/replies -f body="<what you changed>"`
  (use the `id` from the inline comments above).
- For general or summary feedback, post a single summary comment:
  `gh pr comment {{PR}} --body "<summary of what you addressed and what you pushed back on>"`

Keep replies short and specific. State what you changed, or why you didn't.

# FINAL

Once you've addressed everything you can and replied, output <promise>COMPLETE</promise>.
