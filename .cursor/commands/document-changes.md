# Document Changes

Review the current `git diff` and add concise documentation to the most important parts of the changed code.

## Scope

- Only files in the current `git diff` (staged + unstaged)
- Focus on exported functions, complex logic, data transformations, and non-obvious business rules
- Skip trivial, self-explanatory code

## Steps

1. Run `git diff` to identify changed files and lines
2. For each file, identify code that benefits from a short comment:
   - Exported functions and their purpose
   - Complex conditional logic or branching
   - Data transformations (DB ↔ API shape conversions)
   - Business rules not obvious from the code
   - Domain-specific type definitions
3. Clean up existing comments:
   - Remove comments that narrate what the code literally does
   - Remove comments referencing bug fixes, tickets, or PRs
   - Keep comments that explain *why*
4. Write new documentation:
   - **Keep it short** — 1 line for simple functions, 2–4 lines max for complex ones
   - **JSDoc (`/** */`)** for exported functions — a brief summary only; skip `@param`/`@returns` when types make it obvious
   - **Inline comments (`//`)** wherever a reader would pause and wonder "why?" — conditional branches, guard clauses, non-obvious variable assignments, workarounds, implicit conventions, or anything that benefits from a short explanation
   - **Reference domain concepts** (household fallback, membership rules, etc.) when relevant
   - **Plain English** — a teammate should get it without reading surrounding code
5. Apply the changes

## Output Format

For each documented file:

### `path/to/file.ts`
- What was added/updated/removed (one line each)

### Overall
- Files documented, comments added/updated/removed

## Constraints

- Do NOT change any logic, formatting, or behavior — comments and JSDoc only
- Do NOT write verbose, multi-paragraph JSDoc — be concise
- Do NOT narrate what the code literally does
- Do NOT reference bug fixes, tickets, or PRs in comments
- Do NOT comment every line — only where it genuinely helps
- Do NOT add file-header comments or banners
- Preserve existing useful comments
