# TASK

Write a pull request title and description for the changes on branch
`{{BRANCH}}`. Base your summary on the actual diff below — do not invent changes.

# CONTEXT

## Diff vs base

!`git diff {{TARGET_BRANCH}}...{{BRANCH}}`

## Commits

!`git log {{TARGET_BRANCH}}..{{BRANCH}} --format='- %s'`

# OUTPUT

Output EXACTLY the two tagged blocks below and nothing of substance after them.

<pr-title>A concise, imperative PR title, ~70 chars max (no trailing period)</pr-title>
<pr-body>
One or two sentences on **what changed and why**.

## Changes
- Bullet list of the notable changes (group related edits; skip trivia).

## Testing
- What tests were added or run, and how the change was verified.
</pr-body>

Do NOT include a "Closes #..." line — the orchestrator adds issue linkage itself.
