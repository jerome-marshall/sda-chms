# Church domain rules

Read this before you change behavior that a member or church worker would notice.

These are the rules the system enforces. Write new rules in plain domain language. Do not name a variable, a component, or a route.

## People and households

- Every person belongs to a household. A person with no family becomes the head of a new single-member household.
- Each household has exactly one head.
- Only a head creates a household. Everyone else joins an existing one.
- Adding a head without choosing a household creates one automatically.
- The household family name is a label stored on the household. It is not derived from the head's last name.
- The household owns the shared address, phone, and preferred visiting time. A person inherits those values unless they set their own.
- Deleting a household does not delete its members.
- A person is identified by first name, last name, and date of birth. Email is unique across all people.
- Names are title-cased before they are stored.

## Marital status and relationships

- A spouse relationship is the source of truth for marital status. The state is married, separated, divorced, or widowed.
- A manual marital status that contradicts the governing spouse link is rejected.
- With several spouse links, the current one governs: an ongoing marriage before a past one, then the most recently created.
- With no spouse link, marital status is set by hand.
- A spouse link persists through every state. Only a divorce ends the marriage.
- Widowhood follows the partner's membership status. A partner recorded as deceased makes the link widowed, and reversing that status reverses the widowhood.
- A wedding date is only relevant when marital status is not single.

## Membership

- Membership status is member, regular attendee, visitor, inactive, moved, or deceased.
- A person is deceased only when membership status is deceased. A memorial day is a remembrance date, not a second signal.
- Active members are members and regular attendees. Inactive members are the inactive and the moved.
- New this quarter means a date joined church within the last 90 days.
- People are archived with an active flag. They are never hard-deleted.
- Defaults for a new person are single, member, and no dietary preference.

## Sabbath school

Classes by age: Beginner 0 to 3, Kindergarten 4 to 5, Primary 6 to 8, Junior 9 to 11, Earliteen 12 and 13, Youth 14 to 18, Young Adult 19 to 30, Adult 31 and over.

## Dates and celebrations

- Important dates are personal occasions such as a work anniversary or a graduation. They are separate from birthdays, wedding anniversaries, and memorial days.
- Baptism anniversaries are derived from the baptism date.
- An important date is one-time or yearly, and can be personal, church, business, academic, or health.
- Birthdays and wedding anniversaries are celebrations.
- Deceased people are excluded from celebrations and important dates.
- A married couple in one household shares one anniversary celebration.
- Memorial watch shows deceased people whose memorial day falls in the current week.

## Baptism

The minimum baptism age is 8, following Adventist practice.

## Future modules

Attendance, finances, ministries and departments, events, and communications have no rules yet. Add a section here when one is built.
