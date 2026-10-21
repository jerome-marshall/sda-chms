import {
  GENDER_VALUES,
  HOUSEHOLD_ROLE_VALUES,
  MARITAL_STATUS_VALUES,
  MEMBERSHIP_STATUS_VALUES,
  RELATIONSHIP_TYPE_VALUES,
  SABBATH_SCHOOL_CLASS_VALUES,
  SPOUSE_STATE_VALUES,
} from "@sda-chms/shared/constants/people";
import type { ImportantDate } from "@sda-chms/shared/schema/people";
import { relations, sql } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "void/drizzle-zod";
import { check, integer, sqliteTable, text, uniqueIndex } from "void/schema-d1";
import type z from "zod";

// ============================================================================
// COLUMN HELPERS (D1 / SQLite mapping)
// ============================================================================

/**
 * Postgres `uuid PRIMARY KEY DEFAULT gen_random_uuid()` becomes TEXT with a
 * client-generated v4 UUID. D1 has no server-side uuid default, and
 * client-generated ids let a batch insert reference an earlier insert's id
 * (household → person) without a round trip.
 */
const uuidPk = (name: string) =>
  text(name)
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID());

/** Postgres `timestamp DEFAULT now()` becomes integer milliseconds + a client default. */
const createdAt = (name: string) =>
  integer(name, { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date());

const updatedAt = (name: string) =>
  integer(name, { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdateFn(() => new Date());

/**
 * Postgres `date` columns (date_of_birth, wedding_date, …) arrive as
 * 'YYYY-MM-DD' strings in both drivers, so they stay plain TEXT holding ISO
 * date strings — no conversion anywhere up the stack.
 */
const isoDate = (name: string) => text(name);

/** Postgres `boolean` becomes integer 0/1 via boolean mode. */
const booleanCol = (name: string) =>
  integer(name, { mode: "boolean" }).notNull().default(true);

/**
 * SQLite has no enum type and `text({ enum })` only narrows the TypeScript
 * type, so each enum column also gets a `CHECK (col IN (...))` the database
 * enforces. DDL cannot take bound parameters, hence the inlined literals.
 */
const enumCheck = (column: string, values: readonly string[]) =>
  check(
    `${column}_check`,
    sql.raw(
      `"${column}" IN (${values.map((value) => `'${value}'`).join(", ")})`
    )
  );

// ============================================================================
// CORE TABLES
// ============================================================================

export const peopleTable = sqliteTable(
  "people",
  {
    id: uuidPk("id"),
    createdAt: createdAt("created_at"),
    updatedAt: updatedAt("updated_at"),

    // Basic Info
    firstName: text("first_name", { length: 100 }).notNull(),
    lastName: text("last_name", { length: 100 }),
    preferredName: text("preferred_name", { length: 100 }),
    gender: text("gender", { enum: GENDER_VALUES }),
    dateOfBirth: isoDate("date_of_birth"),
    photoUrl: text("photo_url"),

    // Contact Info
    email: text("email", { length: 255 }).unique(),
    phone: text("phone", { length: 50 }),

    // Address
    addressLine1: text("address_line_1", { length: 255 }),
    addressLine2: text("address_line_2", { length: 255 }),
    city: text("city", { length: 100 }),
    state: text("state", { length: 100 }),
    country: text("country", { length: 100 }),

    // Personal Details
    occupation: text("occupation", { length: 255 }),
    fathersName: text("fathers_name", { length: 255 }),
    mothersName: text("mothers_name", { length: 255 }),
    maritalStatus: text("marital_status", {
      enum: MARITAL_STATUS_VALUES,
    }).notNull(),
    weddingDate: isoDate("wedding_date"),
    memorialDay: isoDate("memorial_day"),

    // Church Membership
    membershipStatus: text("membership_status", {
      enum: MEMBERSHIP_STATUS_VALUES,
    }).notNull(),
    baptismDate: isoDate("baptism_date"),
    baptismPlace: text("baptism_place", { length: 255 }),
    dateJoinedChurch: isoDate("date_joined_church"),
    sabbathSchoolClass: text("sabbath_school_class", {
      enum: SABBATH_SCHOOL_CLASS_VALUES,
    }),

    // Preferences
    dietaryPreference: text("dietary_preference"),
    preferredVisitingTime: text("preferred_visiting_time"),

    // Important Dates
    importantDates: text("important_dates", { mode: "json" })
      .$type<ImportantDate[]>()
      .$defaultFn((): ImportantDate[] => []),

    // Private Notes
    visitationNotes: text("visitation_notes"),
    pastoralNotes: text("pastoral_notes"),

    // Household
    householdId: text("household_id").references(() => householdsTable.id, {
      onDelete: "set null",
    }),
    householdRole: text("household_role", { enum: HOUSEHOLD_ROLE_VALUES }),

    // Soft delete
    isActive: booleanCol("is_active"),

    // Identity-dedupe helpers: SQLite rejects expressions in CREATE TABLE
    // UNIQUE constraints (which is all drizzle-kit emits for uniqueIndexes
    // carrying sql`` on sqlite), and treats NULLs as distinct. Stored
    // generated columns materialize the coalesce so a plain uniqueIndex over
    // real columns reproduces the old `NULLS NOT DISTINCT` semantics.
    identityLastName: text("identity_last_name").generatedAlwaysAs(
      sql`coalesce(last_name, '')`,
      { mode: "stored" }
    ),
    identityDateOfBirth: text("identity_date_of_birth").generatedAlwaysAs(
      sql`coalesce(date_of_birth, '')`,
      { mode: "stored" }
    ),
  },
  (table) => [
    // Unique constraint on name + date of birth to prevent duplicate entries.
    // Null last_name / date_of_birth compare equal through the generated
    // identity_* columns, so partial-data People (e.g. visitors with no DOB)
    // can't be duplicated (issue #2).
    uniqueIndex("unique_person_identity").on(
      table.firstName,
      table.identityLastName,
      table.identityDateOfBirth
    ),
    enumCheck("gender", GENDER_VALUES),
    enumCheck("marital_status", MARITAL_STATUS_VALUES),
    enumCheck("membership_status", MEMBERSHIP_STATUS_VALUES),
    enumCheck("sabbath_school_class", SABBATH_SCHOOL_CLASS_VALUES),
    enumCheck("household_role", HOUSEHOLD_ROLE_VALUES),
  ]
);

// ============================================================================
// HOUSEHOLDS
// ============================================================================

export const householdsTable = sqliteTable("households", {
  id: uuidPk("id"),
  // Stored, user-set display/grouping label for the family (ADR-0001).
  // Independent of any member's lastName so blended families and kept
  // surnames are represented without contortion. Nullable: existing rows
  // fall back to a head-derived name until backfilled/edited.
  familyName: text("family_name", { length: 255 }),

  // Shared contact details owned by the Household (ADR-0001). A member's
  // effective value for any of these is their own if set, otherwise the
  // Household's — the per-Person columns of the same name are overrides.
  // This replaces the old "fall back to the Head's value" logic. Nullable so
  // the same shapes as the Person columns line up for the effective-value rule.
  addressLine1: text("address_line_1", { length: 255 }),
  addressLine2: text("address_line_2", { length: 255 }),
  city: text("city", { length: 100 }),
  state: text("state", { length: 100 }),
  country: text("country", { length: 100 }),
  phone: text("phone", { length: 50 }),
  preferredVisitingTime: text("preferred_visiting_time"),

  createdAt: createdAt("created_at"),
  updatedAt: updatedAt("updated_at"),
});

// ============================================================================
// DEPARTMENTS & GROUPS
// ============================================================================

export const departmentsTable = sqliteTable("departments", {
  id: uuidPk("id"),
  name: text("name", { length: 255 }).notNull().unique(),
  description: text("description"),
  isActive: booleanCol("is_active"),
  createdAt: createdAt("created_at"),
  updatedAt: updatedAt("updated_at"),
});

export const peopleDepartmentsTable = sqliteTable("people_departments", {
  id: uuidPk("id"),
  personId: text("person_id")
    .notNull()
    .references(() => peopleTable.id, { onDelete: "cascade" }),
  departmentId: text("department_id")
    .notNull()
    .references(() => departmentsTable.id, { onDelete: "cascade" }),
  joinedAt: isoDate("joined_at"),
  leftAt: isoDate("left_at"),
  isActive: booleanCol("is_active"),
  createdAt: createdAt("created_at"),
});

export const groupsTable = sqliteTable("groups", {
  id: uuidPk("id"),
  name: text("name", { length: 255 }).notNull().unique(),
  description: text("description"),
  isActive: booleanCol("is_active"),
  createdAt: createdAt("created_at"),
  updatedAt: updatedAt("updated_at"),
});

export const peopleGroupsTable = sqliteTable("people_groups", {
  id: uuidPk("id"),
  personId: text("person_id")
    .notNull()
    .references(() => peopleTable.id, { onDelete: "cascade" }),
  groupId: text("group_id")
    .notNull()
    .references(() => groupsTable.id, { onDelete: "cascade" }),
  joinedAt: isoDate("joined_at"),
  leftAt: isoDate("left_at"),
  isActive: booleanCol("is_active"),
  createdAt: createdAt("created_at"),
});

// ============================================================================
// POSITIONS & ROLES
// ============================================================================

export const positionsTable = sqliteTable("positions", {
  id: uuidPk("id"),
  name: text("name", { length: 255 }).notNull().unique(),
  description: text("description"),
  departmentId: text("department_id").references(() => departmentsTable.id, {
    onDelete: "set null",
  }),
  isActive: booleanCol("is_active"),
  createdAt: createdAt("created_at"),
});

export const positionHistoryTable = sqliteTable("position_history", {
  id: uuidPk("id"),
  personId: text("person_id")
    .notNull()
    .references(() => peopleTable.id, { onDelete: "cascade" }),
  positionId: text("position_id")
    .notNull()
    .references(() => positionsTable.id, { onDelete: "cascade" }),
  termStart: isoDate("term_start").notNull(),
  termEnd: isoDate("term_end"),
  notes: text("notes"),
  createdAt: createdAt("created_at"),
  updatedAt: updatedAt("updated_at"),
});

// ============================================================================
// RELATIONSHIPS
// ============================================================================

/**
 * An explicit, stored kinship link between two People (ADR-0003). A single row
 * captures the link in one direction — `relatedPerson` is `type` of `person`
 * (e.g. `{ personId: B, relatedPersonId: A, type: "parent" }` means "A is B's
 * parent"). The reciprocal view (B is A's child) is derived on read, not stored,
 * so a link lives in exactly one row and is removed by deleting that row.
 * Independent of Household: the two People need not share one.
 */
export const relationshipsTable = sqliteTable(
  "relationships",
  {
    id: uuidPk("id"),
    personId: text("person_id")
      .notNull()
      .references(() => peopleTable.id, { onDelete: "cascade" }),
    relatedPersonId: text("related_person_id")
      .notNull()
      .references(() => peopleTable.id, { onDelete: "cascade" }),
    type: text("type", { enum: RELATIONSHIP_TYPE_VALUES }).notNull(),
    // Lifecycle state for a spouse link (ADR-0003): married → separated →
    // divorced / widowed. Nullable because only spouse links carry a state; the
    // link persists through every state change (divorce/death is a state, not a
    // deletion). A Person may hold several spouse links in different states.
    state: text("state", { enum: SPOUSE_STATE_VALUES }),
    createdAt: createdAt("created_at"),
  },
  (table) => [
    // One link of a given type per ordered pair — re-adding the same link is a no-op error.
    uniqueIndex("unique_relationship").on(
      table.personId,
      table.relatedPersonId,
      table.type
    ),
    enumCheck("type", RELATIONSHIP_TYPE_VALUES),
    enumCheck("state", SPOUSE_STATE_VALUES),
  ]
);

// ============================================================================
// RELATIONS
// ============================================================================

export const peopleRelations = relations(peopleTable, ({ one, many }) => ({
  household: one(householdsTable, {
    fields: [peopleTable.householdId],
    references: [householdsTable.id],
  }),
  departments: many(peopleDepartmentsTable),
  groups: many(peopleGroupsTable),
  positionHistory: many(positionHistoryTable),
  // Links where this person is the subject; the reciprocal side is derived on read.
  relationships: many(relationshipsTable, { relationName: "person" }),
  relatedTo: many(relationshipsTable, { relationName: "relatedPerson" }),
}));

export const relationshipsRelations = relations(
  relationshipsTable,
  ({ one }) => ({
    person: one(peopleTable, {
      fields: [relationshipsTable.personId],
      references: [peopleTable.id],
      relationName: "person",
    }),
    relatedPerson: one(peopleTable, {
      fields: [relationshipsTable.relatedPersonId],
      references: [peopleTable.id],
      relationName: "relatedPerson",
    }),
  })
);

export const householdsRelations = relations(householdsTable, ({ many }) => ({
  members: many(peopleTable),
}));

export const departmentsRelations = relations(departmentsTable, ({ many }) => ({
  members: many(peopleDepartmentsTable),
  positions: many(positionsTable),
}));

export const peopleDepartmentsRelations = relations(
  peopleDepartmentsTable,
  ({ one }) => ({
    person: one(peopleTable, {
      fields: [peopleDepartmentsTable.personId],
      references: [peopleTable.id],
    }),
    department: one(departmentsTable, {
      fields: [peopleDepartmentsTable.departmentId],
      references: [departmentsTable.id],
    }),
  })
);

export const groupsRelations = relations(groupsTable, ({ many }) => ({
  members: many(peopleGroupsTable),
}));

export const peopleGroupsRelations = relations(
  peopleGroupsTable,
  ({ one }) => ({
    person: one(peopleTable, {
      fields: [peopleGroupsTable.personId],
      references: [peopleTable.id],
    }),
    group: one(groupsTable, {
      fields: [peopleGroupsTable.groupId],
      references: [groupsTable.id],
    }),
  })
);

export const positionsRelations = relations(
  positionsTable,
  ({ one, many }) => ({
    department: one(departmentsTable, {
      fields: [positionsTable.departmentId],
      references: [departmentsTable.id],
    }),
    history: many(positionHistoryTable),
  })
);

export const positionHistoryRelations = relations(
  positionHistoryTable,
  ({ one }) => ({
    person: one(peopleTable, {
      fields: [positionHistoryTable.personId],
      references: [peopleTable.id],
    }),
    position: one(positionsTable, {
      fields: [positionHistoryTable.positionId],
      references: [positionsTable.id],
    }),
  })
);

// ============================================================================
// ZOD SCHEMAS
// ============================================================================

export const peopleSelectSchemaDb = createSelectSchema(peopleTable);
export const peopleInsertSchemaDb = createInsertSchema(peopleTable);
export const householdsSelectSchemaDb = createSelectSchema(householdsTable);
export const householdsInsertSchemaDb = createInsertSchema(householdsTable);
export const relationshipsSelectSchemaDb =
  createSelectSchema(relationshipsTable);
export const relationshipsInsertSchemaDb =
  createInsertSchema(relationshipsTable);

// ============================================================================
// Types
// ============================================================================
export type PeopleInsertDb = z.infer<typeof peopleInsertSchemaDb>;
export type PeopleSelectDb = z.infer<typeof peopleSelectSchemaDb>;
export type HouseholdsSelectDb = z.infer<typeof householdsSelectSchemaDb>;
export type HouseholdsInsertDb = z.infer<typeof householdsInsertSchemaDb>;
export type RelationshipsSelectDb = z.infer<typeof relationshipsSelectSchemaDb>;
export type RelationshipsInsertDb = z.infer<typeof relationshipsInsertSchemaDb>;
