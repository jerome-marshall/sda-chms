---
status: accepted
---

# One Person response shape, and 404 for a missing record

Every Person response now uses the same transformer and the same wire shape.
`GET /api/people`, `GET /api/people/:id`, `POST /api/people`, and
`PUT /api/people/:id` all return the Person plus the Household's shared contact
fields. A missing Person or Relationship is `HTTPException(404)`.

## Why

Two transformers produced two shapes. `POST` returned the bare row, while the
detail read returned the row plus the Household fields and `isHeadOfHousehold`.
The client carried a second type (`PersonCreated`) and every new Person feature
had to decide which shape it was reading. The difference was an implementation
detail, not a domain distinction: a Person is a Person whether it was just
created or later read.

A plain `Error("Person not found")` reached the error middleware as an unknown
error and became a 500. The Expo client (ADR-0006) would inherit that contract.

## Consequences

- `addPerson` re-reads the created row through the detail query so the response
  comes from one transformer. The extra read buys one wire shape.
- `PersonCreated` is deleted. New slices copy `PersonDetail` and stop there.
- Every "not found" path throws `HTTPException(404)`. Tests pin the unknown-id
  behavior for People and Relationships.
- Household write fields (`familyName` and the shared contacts) are mapped in
  `server/households.ts`, the module that owns the Household. `people.ts` no
  longer owns that rule.
