# Update Business Logic Rules

Review the current git diff for any changes that affect domain rules, and update `.cursor/rules/business-logic.mdc` accordingly.

## Scope

- Only look at uncommitted changes (staged + unstaged)
- Focus on logic that governs **how the system behaves** — not styling, layout, or wiring
- Business logic includes: validation rules, computed values, default values, conditional behavior, status definitions, domain constraints, and any "if X then Y" rules that the system enforces

## Steps

1. Run `git diff` (include both staged and unstaged) to get the full set of changes
2. For each changed file, identify any code that introduces, modifies, or removes business logic — examples:
   - New validation or conditional checks
   - Changed default values or status definitions
   - New computed/derived data logic
   - New domain concepts (entities, statuses, categories)
   - Modified rules around relationships (e.g., household membership, head-of-household)
   - Removed constraints or relaxed rules
3. Read `.cursor/rules/business-logic.mdc` to understand what is currently documented
4. Compare the diff findings against the existing rules:
   - Is there a **new rule** that isn't documented yet? → Add it under the appropriate section
   - Has an **existing rule changed**? → Update it to match the new behavior
   - Has a **rule been removed** or no longer applies? → Remove or mark it as removed
   - Does a **new module or section** need to be created? → Add a new section and move it out of "Future Modules" if applicable
5. If changes are found, update `.cursor/rules/business-logic.mdc` with minimal, focused edits — don't rewrite sections that haven't changed
6. If no business logic changes are detected, report that and make no edits

## Output Format

### Changes Detected
- **Added**: [brief description of new rule]
- **Modified**: [what changed, old → new]
- **Removed**: [what was removed and why]

### Updated Sections
- List which sections of `business-logic.mdc` were touched

### No Changes
If nothing business-logic-related was found, say:
> No business logic changes detected in this diff. `business-logic.mdc` is up to date.

## Constraints

- Do NOT update rules for code that is purely UI/styling (component layout, CSS, colors)
- Do NOT update rules for infrastructure changes (build config, dependencies, dev tooling)
- Do NOT rewrite unrelated sections of the rules file — only touch what the diff affects
- Do NOT add speculative rules for code that "might" be used later — only document what is implemented
- Do NOT duplicate information already in the rules file — check before adding
- Keep rule descriptions concise — one bullet point per rule, not paragraphs
