---
status: accepted
---

# The failure model has three groups

Every failure a `sda-chms` service can raise belongs to exactly one group: a
broken domain rule, an infrastructure fault, or a broken internal assumption.
A caller can tell them apart from the status and the body, and the edge maps
each group once.

## Why

ADR-0008 gave the domain a typed error channel, but it kept one tag,
`DatabaseFailure`, for two unrelated things: a Drizzle or D1 rejection, and a
programmer error raised by `internalFailure` after a write that reported
success but returned no row. Both became `throw failure.cause` at the edge, so

- a database rejection was indistinguishable from a bug in the service, and
- the invariant's `Error(message)` reached the middleware's unknown-error
  branch, which puts an `Error`'s message in the response body.

The consequence is a body that leaks developer text for a bug, and no way to
reason about which failure modes a service actually has. The single tag also
made the import limit awkward: the helper throws `ImportLimitExceeded`, and the
Effect wrapper had to recover it with `instanceof` before it could type the
channel, which is the one place the taxonomy depended on class identity rather
than data.

## Decision

`apps/chms/server/effect/errors.ts` names three groups.

| Group            | Members                                                                                                            | Edge mapping                                                                                              |
| ---------------- | ------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------- |
| `DomainError`    | `PersonNotFound`, `RelationshipNotFound`, `MaritalStatusConflict`, `SpouseStateOnNonSpouse`, `ImportLimitExceeded` | `toHttpException` gives it its 404 or 400 and message, unchanged from the wire contract before this ADR.  |
| `InfraError`     | a database or transport fault, carrying the original `cause`                                                       | `runtime.ts` rethrows the cause, so the constraint, Zod, and unknown-error mapping applies byte for byte. |
| `InvariantError` | a broken internal assumption, carrying an `Error` with the message and stack                                       | `runtime.ts` logs the cause and throws a generic 500 `HTTPException`; the body carries no developer text. |

`internalFailure` returns `InvariantError`. The three groups are also the
`ApiError` union, which is what `runApi` accepts and maps.

The import limit keeps one throw site in `apps/chms/server/import.ts` so a
direct caller still fails the same way. `isImportLimitExceeded` detects it by
tag, not by class identity, so the wrapper can keep the failure typed on the
channel and the tests can pin a 400 at the edge.

## Considered options

- **A `kind` field on one error class.** Rejected: every construction site
  would carry the discriminator, and the existing named classes and the
  `describe` switch already model the domain tags well.
- **Separate `Error` subclasses instead of `Data.TaggedError`.** Rejected:
  the channel would lose its exhaustive tag switch, and `instanceof` is the
  fragile check this ADR is removing.
- **Mapping each group in the middleware.** Rejected: the middleware sees one
  unknown value, so it would have to re-derive the group. The tagged union
  knows the group before the error leaves Effect.
- **Returning the invariant's message in the body.** Rejected: it is developer
  text, may name internals, and gives a caller nothing actionable.

## Consequences

- A new domain rule adds a class, adds it to `DomainError`, and adds its status
  and message to `describe`. Nothing else maps a status.
- A new infrastructure seam fails with `InfraError` and keeps its cause.
- An internal assumption fails with `internalFailure`, which is safe to add
  without widening a wire contract; only the log grows.
- `DatabaseFailure` is gone. A service channel naming it names `InfraError`
  instead, plus `InvariantError` where the service can break its own assumption.
- The invariant 500 body is `Internal Server Error` with no `details` text, and
  the cause stays in the server log.
