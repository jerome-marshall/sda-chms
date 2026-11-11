# Domain docs

The repo uses one context, so domain knowledge lives in two places.

- `CONTEXT.md` at the repo root defines the vocabulary. Use its terms, including the ones it says to avoid.
- `docs/adr/` records decisions. Read the ADRs that touch the area before you change it.

If an output would contradict an ADR, say so in the change instead of overriding it silently.

When a term or a decision is still unresolved, add it to `CONTEXT.md` or write a short ADR. Do not leave the gap in a comment.
