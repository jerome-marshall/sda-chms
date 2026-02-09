# SDA Church Management System - TODO

## People

### Completed ✅
- [x] People list page with data table (filtering, sorting, pagination)
- [x] Add person form (personal info, contact, address, church, family, dietary, notes)
- [x] Person detail page with tabbed layout (Overview, Church, Notes)
- [x] Profile header with avatar, membership badge, and contact chips
- [x] API: Get all people, Get person by ID, Create person
- [x] Database schema for people table
- [x] Zod validation schema for person creation
- [x] Data hooks: `usePeople`, `useAddPerson`

### To Do 📋
- [ ] Edit person (form, API endpoint, route or dialog)
- [ ] Delete person (confirmation dialog, API endpoint)
- [ ] Photo upload for profile pictures
- [ ] Search/filter on person detail or across the app

---

## Households

### Completed ✅
- [x] Database schema for households table
- [x] Auto-create household when adding a head of household
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
- [x] Data hook: `useGroups`

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
- [x] Dark/light theme toggle
- [x] Type-safe API client (Hono RPC)
- [x] Reusable data table components
- [x] Reusable form components (input, select, multi-select, date picker, textarea)
- [x] Error handling (DB errors, API validation)
- [x] Shared constants for enums (gender, membership status, etc.)

### To Do 📋
- [ ] Dashboard / home page (currently a placeholder)
- [ ] Loading states and error boundaries for routes
- [ ] Global search across people, groups, departments
- [ ] User authentication and authorization
- [ ] Reports or data export
