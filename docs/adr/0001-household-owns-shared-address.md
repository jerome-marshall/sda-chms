---
status: accepted
---

# Household owns shared contact details and family name

A Household owns the shared contact details of the family — postal address, phone,
and preferred visiting time — plus a family-name label. Each is inherited by a
member who has no value of their own: a Person's **effective value** for one of
these fields is their own if set, otherwise the Household's. The family name is a
display/grouping label only and is independent of any member's `lastName` — members
of one Household may all carry different surnames.

## Considered options

- **Per Person (status quo).** Every Person carries their own contact details;
  families re-enter the same address on each member. Rejected: duplication, and no
  single place to update when a family moves.
- **Inherit from the Head of household (prior implementation).** Non-heads fell
  back to the Head's value via `getInfoOrFromHousehold`. Rejected: it ties shared
  data to one member's record — if the Head is removed or reassigned, the family's
  contact logic breaks. The Household, not a person, is the natural owner.
- **Household owns shared data (chosen).** The Household is the single owner of the
  shared contact details; a per-Person override covers the member who lives or is
  reached elsewhere.

## Consequences

- `getInfoOrFromHousehold` changes from "fall back to the Head's value" to "fall
  back to the Household's value", for the full set it already covers: `addressLine1`,
  `addressLine2`, `city`, `state`, `country`, `phone`, and `preferredVisitingTime`.
- The effective-value rule (`person ?? household`) must be applied consistently
  everywhere one of these shared fields is read or displayed.
- Moving a Person between Households (with no override) re-points their effective
  values automatically.
- Because the family name is independent of `lastName`, blended families and
  members who keep their own surname are represented without contortion.
