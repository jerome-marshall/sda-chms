# SDA Church Management

The domain of a Seventh-day Adventist local church: the People it cares for, the
Households they belong to, and the ministry structure (Departments, Groups,
Positions) they serve in.

## People & membership

**Person**:
The central record for anyone the church tracks — members, regular attendees,
visitors, and the deceased. The entity is always a Person; "Member" is one
possible status, not a synonym.
_Avoid_: Member (it's a status), Contact, User, Profile

**Membership Status**:
A Person's standing with the church: Member, Regular Attendee, Visitor, Inactive,
Moved, or Deceased.
_Avoid_: membership type, category

**Member**:
A baptized person in fellowship with the church — a single _value_ of Membership
Status. Never use "member" to mean "any Person in the system."
_Avoid_: using "member" as a synonym for Person

**Baptism**:
The rite (adult baptism by immersion) marking entry into church membership;
recorded as a baptism date and place.
_Avoid_: christening, confirmation

**Memorial Day**:
The date a Person passed away, surfaced each year as a remembrance anniversary for
pastoral follow-up. Recorded for a Person whose Membership Status is Deceased —
that status, not this date, is what marks a Person as deceased. Not the US holiday.
_Avoid_: date of death / death date (the product's term is "Memorial Day")

## Household & relationships

**Household**:
A grouping of People who form one family unit, sharing a family name and default
contact details (address, phone, visiting time) that members inherit and may
individually override. Each member carries a Household Role; a non-Head must be
linked to an existing Household, while a Head defines one.
_Avoid_: Family, Unit

**Household Role**:
A Person's place within their Household: Head, Spouse, Child, or Other. Distinct
from a Relationship (a typed link between two People) and from a Position (a church
office).
_Avoid_: family role

**Relationship**:
A typed kinship link between two specific People — spouse, parent, child, sibling,
grandparent, grandchild, step-parent, step-child, step-sibling, half-sibling, or
other — entered explicitly and stored, independent of Household (related People need
not share a Household, and Household members need not be related). A **spouse**
Relationship carries a lifecycle — married, separated, divorced, widowed — and
persists through all of them; only a legal divorce ends the marriage.
_Avoid_: Household Role (that's a slot within one family unit, not a link); deriving
spouse from Head/Spouse roles (it is stored, not derived)

## Sabbath School

**Sabbath School**:
The Saturday-morning, age-divided Bible-study program (the SDA counterpart to
Sunday school). A Person is assigned a Sabbath School Class.
_Avoid_: Sunday school

**Sabbath School Class**:
The age-based division a Person belongs to: Beginner, Kindergarten, Primary,
Junior, Earliteen, Youth, Young Adult, Adult.
_Avoid_: grade, age group (for the class itself); Inverse / AYA (use "Young Adult")

## Ministry structure

**Department**:
An official, standing area of church ministry that holds offices — e.g. Sabbath
School, Youth, Music, Personal Ministries, Health Ministries. People belong to
Departments, and Positions are defined within them.
_Avoid_: ministry (as the entity name), team

**Group**:
An informal, fluid affiliation of People with no offices attached — e.g. a small
group, choir, prayer band, or Bible-study circle. Unlike a Department, a Group
carries no Positions and can form or dissolve freely.
_Avoid_: Department (a Group has no offices), committee

**Position**:
A named office a Person holds in the church — e.g., Elder, Deacon, Clerk,
Treasurer — optionally tied to a Department and held for a dated term.
_Avoid_: Role, Title, Job

**Position History**:
The temporal record of who held a Position and when (term start/end). There is no
separate "current position" — a current holder is one whose term has not ended.
_Avoid_: appointment, assignment

## Cross-cutting

**isActive (record flag)**:
A soft-delete / archive flag on most records (People, Departments, Groups,
memberships, Positions). It means "this record is not deleted" — it says nothing
about a Person's church participation.
_Avoid_: conflating with the Inactive membership status

**Inactive (membership)**:
A Member who has stopped participating but remains on the books. This is a
Membership Status value, unrelated to the isActive record flag.
_Avoid_: deleted, archived (pick "Inactive" for lapsed participation)
