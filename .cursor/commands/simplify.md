# Simplify Code

Review recently modified or selected code for opportunities to improve readability and maintainability without changing functionality.

## Scope

- Only files in the current `git diff` (staged + unstaged), or a specific file/selection if provided
- Focus on logic, structure, and naming — not formatting (Biome handles that)
- Skip code that is already clear and well-structured

## What to Look For

- **Unnecessary complexity**: Deep nesting, convoluted control flow, overly abstract layers that obscure intent
- **Redundant code**: Duplicated logic, unused variables, dead branches, re-derivations of already-available values
- **Poor naming**: Variables, functions, or types whose names don't communicate their purpose
- **Nested ternaries**: Replace with `if/else` chains or `switch` statements — clarity over brevity
- **Dense one-liners**: Break apart expressions that pack too many operations into a single line
- **Over-abstraction**: Wrappers, helpers, or indirection that exist "just in case" but add no current value
- **Implicit logic**: Code that relies on non-obvious side effects, type coercion, or ordering assumptions without explanation

## Steps

1. Identify the target code — either from `git diff` or the provided selection
2. Read through each section and ask: *"Would a teammate understand this on first read?"*
3. For each opportunity found:
   - Describe what makes the current code harder to follow
   - Apply the simplification directly
   - Verify the behavior is identical
4. After all changes, run `bun x ultracite fix` to ensure formatting compliance
5. Summarize what was changed and why

## Simplification Principles

- **Readable over compact** — prefer explicit code that reads like prose over clever shortcuts
- **Flat over nested** — use early returns and guard clauses to reduce indentation depth
- **Named over anonymous** — extract complex expressions into well-named variables or functions
- **Simple over abstract** — don't introduce patterns, generics, or abstractions until they're needed more than once
- **Obvious over documented** — rewrite confusing code to be self-explanatory before reaching for a comment

## Output Format

For each simplified file:

### `path/to/file.ts`
- **Before**: Brief description of the issue
- **After**: What was changed and why it's clearer

### Overall
- Files simplified, number of changes applied

## Constraints

- Do NOT change any observable behavior, outputs, or side effects
- Do NOT rename exported symbols that are used elsewhere without updating all references
- Do NOT combine unrelated functions or components to "save lines"
- Do NOT remove abstractions that genuinely improve organization (e.g., shared utilities, data-access layers)
- Do NOT refactor beyond the scope of recent changes unless explicitly asked
- Do NOT prioritize fewer lines of code over readability — sometimes more lines is clearer
- Do NOT introduce new dependencies, patterns, or utilities — simplify with what already exists
- Preserve all existing tests and ensure they still pass
