---------------------------- MODULE HouseholdHead ----------------------------
(***************************************************************************)
(* Concurrent `PUT /api/people/:id` requests that set a Person's Household *)
(* and Household Role. D1 has no interactive transaction: the service      *)
(* reads and checks, then writes one `db.batch`. Another request can       *)
(* commit between the two.                                                 *)
(*                                                                         *)
(*   Validate  update in apps/chms/server/effect/people.ts, from           *)
(*             getPersonRowById through the getHouseholdHeadRow check      *)
(*   Commit    the db.batch at the end of the same update                  *)
(*   UniqueHeadIndex  unique_household_head in                             *)
(*             apps/chms/src/db/schema/people.ts                           *)
(*   "member"  any Household Role other than head: spouse, child, other    *)
(***************************************************************************)
EXTENDS FiniteSets, Naturals

CONSTANTS People, Households, Requests, UniqueHeadIndex

Roles == {"head", "member"}

VARIABLES role, home, pc, ask

vars == <<role, home, pc, ask>>

HeadsOf(h, r, hm) == {p \in People : hm[p] = h /\ r[p] = "head"}

AtMostOneHead ==
    \A h \in Households : Cardinality(HeadsOf(h, role, home)) <= 1

HeadKept ==
    [][\A h \in Households :
         HeadsOf(h, role, home) # {} => HeadsOf(h, role', home') # {}]_vars

Allowed(who, to, as) ==
    /\ ~(role[who] = "head" /\ to # home[who])
    /\ ~(role[who] = "head" /\ as # "head")
    /\ ~(as = "head" /\ \E q \in People \ {who} :
                           home[q] = to /\ role[q] = "head")

Init ==
    /\ role \in [People -> Roles]
    /\ home \in [People -> Households]
    /\ AtMostOneHead
    /\ pc = [r \in Requests |-> "idle"]
    /\ ask = [r \in Requests |-> <<>>]

Validate(r) ==
    /\ pc[r] = "idle"
    /\ \E who \in People, to \in Households, as \in Roles :
         /\ ask' = [ask EXCEPT ![r] = [who |-> who, to |-> to, as |-> as]]
         /\ pc' = [pc EXCEPT ![r] =
                     IF Allowed(who, to, as) THEN "checked" ELSE "refused"]
    /\ UNCHANGED <<role, home>>

Commit(r) ==
    /\ pc[r] = "checked"
    /\ LET a == ask[r]
           role2 == [role EXCEPT ![a.who] = a.as]
           home2 == [home EXCEPT ![a.who] = a.to]
       IN IF UniqueHeadIndex /\ Cardinality(HeadsOf(a.to, role2, home2)) > 1
          THEN /\ pc' = [pc EXCEPT ![r] = "refused"]
               /\ UNCHANGED <<role, home>>
          ELSE /\ role' = role2
               /\ home' = home2
               /\ pc' = [pc EXCEPT ![r] = "saved"]
    /\ UNCHANGED ask

Finished ==
    /\ \A r \in Requests : pc[r] \in {"saved", "refused"}
    /\ UNCHANGED vars

Next == (\E r \in Requests : Validate(r) \/ Commit(r)) \/ Finished

Spec == Init /\ [][Next]_vars
=============================================================================
