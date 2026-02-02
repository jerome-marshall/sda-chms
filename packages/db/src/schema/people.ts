import {
  GENDER_VALUES,
  HOUSEHOLD_ROLE_VALUES,
  MARITAL_STATUS_VALUES,
  MEMBERSHIP_STATUS_VALUES,
  SABBATH_SCHOOL_CLASS_VALUES,
} from "@sda-chms/shared/constants/people";
import { relations } from "drizzle-orm";
import {
  boolean,
  date,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import type z from "zod";

// ============================================================================
// ENUMS
// ============================================================================

export const genderEnum = pgEnum("gender", GENDER_VALUES);

export const membershipStatusEnum = pgEnum(
  "membership_status",
  MEMBERSHIP_STATUS_VALUES
);

export const maritalStatusEnum = pgEnum(
  "marital_status",
  MARITAL_STATUS_VALUES
);

export const householdRoleEnum = pgEnum(
  "household_role",
  HOUSEHOLD_ROLE_VALUES
);

export const sabbathSchoolClassEnum = pgEnum(
  "sabbath_school_class",
  SABBATH_SCHOOL_CLASS_VALUES
);

// ============================================================================
// CORE TABLES
// ============================================================================

export const peopleTable = pgTable(
  "people",
  {
    id: uuid().primaryKey().defaultRandom(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),

    // Basic Info
    firstName: varchar("first_name", { length: 100 }).notNull(),
    lastName: varchar("last_name", { length: 100 }).notNull(),
    preferredName: varchar("preferred_name", { length: 100 }),
    gender: genderEnum(),
    dateOfBirth: date("date_of_birth"),
    photoUrl: text("photo_url"),

    // Contact Info
    email: varchar({ length: 255 }).unique(),
    phone: varchar({ length: 50 }).notNull(),

    // Address
    addressLine1: varchar("address_line_1", { length: 255 }),
    addressLine2: varchar("address_line_2", { length: 255 }),
    city: varchar({ length: 100 }),
    state: varchar({ length: 100 }),
    country: varchar({ length: 100 }),

    // Personal Details
    occupation: varchar({ length: 255 }).notNull(),
    maritalStatus: maritalStatusEnum("marital_status").notNull(),
    weddingDate: date("wedding_date"),
    memorialDay: date("memorial_day"),

    // Church Membership
    membershipStatus: membershipStatusEnum("membership_status").notNull(),
    baptismDate: date("baptism_date"),
    baptismPlace: varchar("baptism_place", { length: 255 }),
    dateJoinedChurch: date("date_joined_church"),
    sabbathSchoolClass: sabbathSchoolClassEnum(
      "sabbath_school_class"
    ).notNull(),

    // Preferences
    dietaryPreference: text("dietary_preference"),
    preferredVisitingTime: text("preferred_visiting_time"),

    // Private Notes
    visitationNotes: text("visitation_notes"),
    pastoralNotes: text("pastoral_notes"),

    // Household
    householdId: uuid("household_id").references(() => householdsTable.id, {
      onDelete: "set null",
    }),
    householdRole: householdRoleEnum("household_role"),

    // Soft delete
    isActive: boolean("is_active").notNull().default(true),
  },
  (table) => [
    // Unique constraint on name + date of birth to prevent duplicate entries
    uniqueIndex("unique_person_identity").on(
      table.firstName,
      table.lastName,
      table.dateOfBirth
    ),
  ]
);

// ============================================================================
// HOUSEHOLDS
// ============================================================================

export const householdsTable = pgTable("households", {
  id: uuid().primaryKey().defaultRandom(),
  name: varchar({ length: 255 }).notNull(),
  addressLine1: varchar("address_line_1", { length: 255 }),
  addressLine2: varchar("address_line_2", { length: 255 }),
  city: varchar({ length: 100 }),
  state: varchar({ length: 100 }),
  country: varchar({ length: 100 }),
  phone: varchar({ length: 50 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

// ============================================================================
// DEPARTMENTS & GROUPS
// ============================================================================

export const departmentsTable = pgTable("departments", {
  id: uuid().primaryKey().defaultRandom(),
  name: varchar({ length: 255 }).notNull().unique(),
  description: text(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const peopleDepartmentsTable = pgTable("people_departments", {
  id: uuid().primaryKey().defaultRandom(),
  personId: uuid("person_id")
    .notNull()
    .references(() => peopleTable.id, { onDelete: "cascade" }),
  departmentId: uuid("department_id")
    .notNull()
    .references(() => departmentsTable.id, { onDelete: "cascade" }),
  joinedAt: date("joined_at"),
  leftAt: date("left_at"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const groupsTable = pgTable("groups", {
  id: uuid().primaryKey().defaultRandom(),
  name: varchar({ length: 255 }).notNull().unique(),
  description: text(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const peopleGroupsTable = pgTable("people_groups", {
  id: uuid().primaryKey().defaultRandom(),
  personId: uuid("person_id")
    .notNull()
    .references(() => peopleTable.id, { onDelete: "cascade" }),
  groupId: uuid("group_id")
    .notNull()
    .references(() => groupsTable.id, { onDelete: "cascade" }),
  joinedAt: date("joined_at"),
  leftAt: date("left_at"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ============================================================================
// POSITIONS & ROLES
// ============================================================================

export const positionsTable = pgTable("positions", {
  id: uuid().primaryKey().defaultRandom(),
  name: varchar({ length: 255 }).notNull().unique(),
  description: text(),
  departmentId: uuid("department_id").references(() => departmentsTable.id, {
    onDelete: "set null",
  }),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const positionHistoryTable = pgTable("position_history", {
  id: uuid().primaryKey().defaultRandom(),
  personId: uuid("person_id")
    .notNull()
    .references(() => peopleTable.id, { onDelete: "cascade" }),
  positionId: uuid("position_id")
    .notNull()
    .references(() => positionsTable.id, { onDelete: "cascade" }),
  termStart: date("term_start").notNull(),
  termEnd: date("term_end"),
  notes: text(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

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
}));

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

// ============================================================================
// Types
// ============================================================================
export type PeopleInsertDb = z.infer<typeof peopleInsertSchemaDb>;
export type PeopleSelectDb = z.infer<typeof peopleSelectSchemaDb>;
