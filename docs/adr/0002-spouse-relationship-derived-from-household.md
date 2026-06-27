---
status: superseded by ADR-0003
---

> **Superseded by [ADR-0003](0003-relationships-are-explicit.md).** Deriving spouse
> from Household Roles cannot track ex-spouses, widowhood, or a separation where the
> couple lives apart, and it collapses step-relations into "other" — all of which the
> church needs. Relationships, including spouse, are now explicit and stored. The
> content below is retained as historical record.

# Spouse relationships are derived from Household Roles, not stored

A spouse Relationship is never entered or stored directly — it is computed from the
Head↔Spouse roles within a Household. Every other relationship type (parent, child,
sibling, grandparent, grandchild, other) is entered explicitly and stored as its
own row.

## Why

- A married couple is already modeled by Household Roles (one Head, one Spouse). A
  separate spouse row would duplicate that and invite drift.
- Deriving keeps the two views automatically consistent: change the roles and the
  spouse link follows; divorce or leaving the Household drops it with no orphaned
  row to clean up.
- Other links stay explicit because they must work across Households — e.g. a
  non-custodial parent in a different Household from their child — which a
  household-derived link could never express.

## Rules and invariants

- A Household has at most one Spouse, married to its Head; the derived link is
  Head↔Spouse.
- Deceased members are excluded from derivation — a surviving partner is widowed,
  not actively "spouse of" a deceased Person.
- A spouse who is not a co-resident Household member cannot be represented. Accepted
  for a church directory, where spouses share a Household. If that ever breaks, the
  fallback is to auto-seed a stored spouse row from the roles and let it persist.

## Consequences

- The relationships store holds parent/child/sibling/etc. rows but NO spouse rows,
  by design — a future reader should not "fix" this by adding them.
- "Spouse" stays a RELATIONSHIP_TYPE value so the derived link carries a type, even
  though instances are never persisted.
- Spouse is therefore asymmetric from the other relationship types: any code that
  lists a Person's relationships must union the stored rows with the derived spouse.
