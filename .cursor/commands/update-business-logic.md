# Update Business Logic Rules

Review the current git diff for any changes that affect domain rules, and update `.cursor/rules/business-logic.mdc` accordingly.

## Scope

- Only look at uncommitted changes (staged + unstaged)
- Focus on logic that governs **how the system behaves** — not styling, layout, or wiring
- Business logic includes: validation rules, default values, conditional behavior, status definitions, domain constraints, and any "if X then Y" rules that the system enforces
- Business logic does **NOT** include: sorting order, filtering mechanics, UI layout, component names, API calls, date/time calculations, computed display values (e.g., "years since"), or any other implementation/technical detail

## Steps

1. Run `git diff` (include both staged and unstaged) to get the full set of changes
2. For each changed file, identify any code that introduces, modifies, or removes business logic — examples:
   - New validation or conditional checks
   - Changed default values or status definitions
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

### Writing Style (critical)

- Write rules in **plain domain language** — describe how the system behaves, not how it's built
- A non-technical person should be able to read and understand every rule
- NEVER reference code constructs: variable names, function names, field names, types (e.g., ~~`person.age`~~, ~~`isDeceased`~~)
- NEVER reference UI elements: widget names, card names, page names, component names (e.g., ~~"dashboard widget"~~, ~~"celebrations card"~~)
- NEVER describe implementation details: sorting algorithms, filtering logic, API endpoints, data transformations, date/time calculations, how values are computed or projected
- DO describe: who is included/excluded, what qualifies as something, what defaults apply, what conditions trigger behavior
- Ask yourself: "Is this a **rule the system enforces**, or is it just **how** the system calculates something?" — only document the former
- Example — BAD: "The celebrations widget shows birthdays sorted by date descending using `person.age`"
- Example — GOOD: "Birthdays and wedding anniversaries are considered celebrations"
