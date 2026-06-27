---
status: accepted
---

# Relationships are explicit and stored — including spouse

Every kinship Relationship, **including spouse**, is entered explicitly and stored.
None are derived from Household Roles. This reverses
[ADR-0002](0002-spouse-relationship-derived-from-household.md).

## Why

A derived spouse link is present-tense and bound to co-residence, so it cannot
record what the church needs to keep:

- **Ex-spouse.** After a divorce the marriage must remain as a (former) link, not
  vanish. The link stays `spouse`; a divorced marriage is the same link in a
  `divorced` state.
- **Widowhood.** When a spouse dies, the link to the deceased partner must persist.
- **Separation.** A separated couple is still husband and wife until legally
  divorced; living in different Households must not sever the link.
- **Step / blended families.** Step-parent, step-child, and half-sibling must be
  first-class, not collapsed into `other`.
- **More than one marriage over a lifetime.** Widowed-then-remarried or
  divorced-then-remarried means a Person holds several spouse links in different
  states. A single derived link — or the single person-level `maritalStatus` —
  cannot represent "widowed from A, married to B." Explicit per-couple links can.

## The spouse lifecycle

A spouse Relationship carries a state — **married → separated → divorced / widowed**
— and persists through all of them. Only a legal divorce ends the marriage;
separation and a partner's death are states of the relationship, not its deletion.

## Consequences

- Household Roles (Head / Spouse) no longer imply a spouse link. To avoid double
  entry, the UI may **pre-fill** a spouse Relationship when a Head and Spouse are
  set — but it is then stored and editable, not derived. This preserves the
  convenience that motivated ADR-0002 without its limitations.
- The relationships store now holds spouse rows (the opposite of ADR-0002).
- Person-level `maritalStatus` and a spouse link's state can disagree; the rule
  below keeps them consistent rather than letting them drift.

## Resolved

- **Marital status — link wins when it exists.** When a spouse Relationship exists,
  its state is the source of truth and the Person's `maritalStatus` follows it. When
  no link exists (e.g. the spouse isn't in the directory), `maritalStatus` is set
  manually. Same single-source principle as the deceased-signal decision.
- **Types added:** `step_parent`, `step_child`, `step_sibling`, and `half_sibling`
  are first-class relationship types. No `partner` type for now — unmarried
  cohabiting stays `other`.
