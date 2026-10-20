# SDA Church Management System - TODO

## People

### Completed ✅

- [x] People list page with data grid (client-side filtering and sorting; no pagination)
- [x] Add person form (personal info, contact, address, church, family, dietary, notes)
- [x] Person detail page with stacked sections (ProfileHeader, Overview, Church, Notes)
- [x] Profile header with avatar, membership badge, and contact chips
- [x] API: Get all people, Get person by ID, Create person, Update person
- [x] Database schema for people table
- [x] Zod validation schema for person creation
- [x] Data hooks: `usePeople`, `useAddPerson`, `useUpdatePerson`
- [x] Edit person form (full replace; marital status locked to the spouse link)

### To Do 📋

- [ ] Delete person (confirmation dialog, API endpoint)
- [ ] Photo upload for profile pictures
- [ ] Search/filter on person detail or across the app

---

## Relationships

### Completed ✅

- [x] Database schema for relationships table (explicit typed links, ADR-0003)
- [x] API: Create, update state, delete, list per person
- [x] Marital status synchronized from the governing spouse link (ADR-0003)
- [x] Spouse pre-fill from complementary household roles in the edit form
- [x] Data hooks: `useRelationships`, `useAddRelationship`, `useUpdateRelationshipState`, `useRemoveRelationship`

---

## Households

### Completed ✅

- [x] Database schema for households table
- [x] Auto-create household when adding a head of household
- [x] Household contact details edited through the head's person form (ADR-0001)
- [x] API: Get all households (with members)
- [x] Data hook: `useHouseholds`

### To Do 📋

- [ ] Households list page / UI
- [ ] Household detail view (show all members)
- [ ] Assign/remove people from households
- [ ] Edit household details

---

## Groups

### Completed ✅

- [x] Database schema for groups table and people-groups join table
- [x] API: Get all groups
- [x] Data hook: `useGroups` (fetched; no UI renders groups yet)

### To Do 📋

- [ ] Groups list page / UI
- [ ] Create group form
- [ ] Group detail view (show members)
- [ ] Add/remove people from groups
- [ ] Edit / delete group
- [ ] API: Create, Update, Delete group
- [ ] API: Manage group membership

---

## Departments

Schema-only by design so far. The API and UI are the next milestone.

### Completed ✅

- [x] Database schema for departments table and people-departments join table

### To Do 📋

- [ ] API routes for departments (CRUD)
- [ ] Departments list page / UI
- [ ] Create / edit / delete department
- [ ] Assign/remove people from departments
- [ ] Department detail view (show members)

---

## Positions

Schema-only by design so far. The API and UI are the next milestone.

### Completed ✅

- [x] Database schema for positions table and position history table

### To Do 📋

- [ ] API routes for positions (CRUD)
- [ ] Positions management UI
- [ ] Assign positions to people (with term start/end)
- [ ] Position history view per person

---

## General / App-Wide

### Completed ✅

- [x] App layout with sidebar navigation
- [x] Type-safe API client (`void/client` fetch typed by the generated RouteMap)
- [x] Reusable data grid components (the data-table stack is unused scaffold)
- [x] Dashboard with real data (stat cards, celebrations, memorial watch, important dates, age chart, membership breakdown)
- [x] Reusable form components (input, select, multi-select, date picker, textarea)
- [x] Error handling (DB errors, API validation)
- [x] Shared constants for enums (gender, membership status, etc.)

### To Do 📋

- [ ] Mount the theme toggle (theme infrastructure exists; the toggle is unreachable through the UI)
- [ ] Loading states and error boundaries for routes
- [ ] Global search across people, groups, departments
- [ ] User authentication and authorization
- [ ] Reports or data export
