import { relations } from "drizzle-orm";
import {
  boolean,
  date,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

// ============================================================================
// ENUMS
// ============================================================================

export const genderEnum = pgEnum("gender", ["male", "female"]);

export const membershipStatusEnum = pgEnum("membership_status", [
  "member",
  "regular_attendee",
  "visitor",
  "inactive",
  "moved",
  "deceased",
]);

export const maritalStatusEnum = pgEnum("marital_status", [
  "single",
  "married",
  "divorced",
  "widowed",
  "separated",
]);

export const householdRoleEnum = pgEnum("household_role", [
  "head",
  "spouse",
  "child",
  "other",
]);

export const relationshipTypeEnum = pgEnum("relationship_type", [
  "parent",
  "child",
  "spouse",
  "sibling",
  "grandparent",
  "grandchild",
  "other",
]);

// ============================================================================
// CORE TABLES
// ============================================================================

export const people = pgTable("people", {
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
  skills: text("skills"),
  maritalStatus: maritalStatusEnum("marital_status").notNull(),
  weddingDate: date("wedding_date"),
  memorialDay: date("memorial_day"),

  // Church Membership
  membershipStatus: membershipStatusEnum("membership_status").notNull(),
  baptismDate: date("baptism_date"),
  baptismPlace: varchar("baptism_place", { length: 255 }),
  dateJoinedChurch: date("date_joined_church"),

  // Preferences
  dietaryPreferences: text("dietary_preferences"),

  // Private Notes
  visitationNotes: text("visitation_notes"),
  pastoralNotes: text("pastoral_notes"),

  // Household
  householdId: uuid("household_id"),
  householdRole: householdRoleEnum("household_role"),

  // Soft delete
  isActive: boolean("is_active").notNull().default(true),
});

// ============================================================================
// HOUSEHOLDS
// ============================================================================

export const households = pgTable("households", {
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
// RELATIONSHIPS
// ============================================================================

export const relationships = pgTable("relationships", {
  id: uuid().primaryKey().defaultRandom(),
  personId: uuid("person_id")
    .notNull()
    .references(() => people.id, { onDelete: "cascade" }),
  relatedPersonId: uuid("related_person_id")
    .notNull()
    .references(() => people.id, { onDelete: "cascade" }),
  relationshipType: relationshipTypeEnum("relationship_type").notNull(),
  notes: text(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ============================================================================
// DEPARTMENTS & GROUPS
// ============================================================================

export const departments = pgTable("departments", {
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

export const peopleDepartments = pgTable("people_departments", {
  id: uuid().primaryKey().defaultRandom(),
  personId: uuid("person_id")
    .notNull()
    .references(() => people.id, { onDelete: "cascade" }),
  departmentId: uuid("department_id")
    .notNull()
    .references(() => departments.id, { onDelete: "cascade" }),
  role: varchar({ length: 100 }),
  joinedAt: date("joined_at"),
  leftAt: date("left_at"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const groups = pgTable("groups", {
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

export const peopleGroups = pgTable("people_groups", {
  id: uuid().primaryKey().defaultRandom(),
  personId: uuid("person_id")
    .notNull()
    .references(() => people.id, { onDelete: "cascade" }),
  groupId: uuid("group_id")
    .notNull()
    .references(() => groups.id, { onDelete: "cascade" }),
  joinedAt: date("joined_at"),
  leftAt: date("left_at"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ============================================================================
// POSITIONS & ROLES
// ============================================================================

export const positions = pgTable("positions", {
  id: uuid().primaryKey().defaultRandom(),
  name: varchar({ length: 255 }).notNull().unique(),
  description: text(),
  departmentId: uuid("department_id").references(() => departments.id, {
    onDelete: "set null",
  }),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const positionHistory = pgTable("position_history", {
  id: uuid().primaryKey().defaultRandom(),
  personId: uuid("person_id")
    .notNull()
    .references(() => people.id, { onDelete: "cascade" }),
  positionId: uuid("position_id")
    .notNull()
    .references(() => positions.id, { onDelete: "cascade" }),
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
// SABBATH SCHOOL CLASSES
// ============================================================================

export const sabbathSchoolClasses = pgTable("sabbath_school_classes", {
  id: uuid().primaryKey().defaultRandom(),
  name: varchar({ length: 255 }).notNull(),
  description: text(),
  ageGroup: varchar("age_group", { length: 100 }),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const peopleSabbathSchoolClasses = pgTable(
  "people_sabbath_school_classes",
  {
    id: uuid().primaryKey().defaultRandom(),
    personId: uuid("person_id")
      .notNull()
      .references(() => people.id, { onDelete: "cascade" }),
    sabbathSchoolClassId: uuid("sabbath_school_class_id")
      .notNull()
      .references(() => sabbathSchoolClasses.id, { onDelete: "cascade" }),
    role: varchar({ length: 100 }),
    joinedAt: date("joined_at"),
    leftAt: date("left_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  }
);

// ============================================================================
// RELATIONS
// ============================================================================

export const peopleRelations = relations(people, ({ one, many }) => ({
  household: one(households, {
    fields: [people.householdId],
    references: [households.id],
  }),
  departments: many(peopleDepartments),
  groups: many(peopleGroups),
  sabbathSchoolClasses: many(peopleSabbathSchoolClasses),
  positionHistory: many(positionHistory),
  relationshipsAsSubject: many(relationships, { relationName: "subject" }),
  relationshipsAsRelated: many(relationships, { relationName: "related" }),
}));

export const householdsRelations = relations(households, ({ many }) => ({
  members: many(people),
}));

export const departmentsRelations = relations(departments, ({ many }) => ({
  members: many(peopleDepartments),
  positions: many(positions),
}));

export const peopleDepartmentsRelations = relations(
  peopleDepartments,
  ({ one }) => ({
    person: one(people, {
      fields: [peopleDepartments.personId],
      references: [people.id],
    }),
    department: one(departments, {
      fields: [peopleDepartments.departmentId],
      references: [departments.id],
    }),
  })
);

export const groupsRelations = relations(groups, ({ many }) => ({
  members: many(peopleGroups),
}));

export const peopleGroupsRelations = relations(peopleGroups, ({ one }) => ({
  person: one(people, {
    fields: [peopleGroups.personId],
    references: [people.id],
  }),
  group: one(groups, {
    fields: [peopleGroups.groupId],
    references: [groups.id],
  }),
}));

export const positionsRelations = relations(positions, ({ one, many }) => ({
  department: one(departments, {
    fields: [positions.departmentId],
    references: [departments.id],
  }),
  history: many(positionHistory),
}));

export const positionHistoryRelations = relations(
  positionHistory,
  ({ one }) => ({
    person: one(people, {
      fields: [positionHistory.personId],
      references: [people.id],
    }),
    position: one(positions, {
      fields: [positionHistory.positionId],
      references: [positions.id],
    }),
  })
);

export const sabbathSchoolClassesRelations = relations(
  sabbathSchoolClasses,
  ({ many }) => ({
    members: many(peopleSabbathSchoolClasses),
  })
);

export const peopleSabbathSchoolClassesRelations = relations(
  peopleSabbathSchoolClasses,
  ({ one }) => ({
    person: one(people, {
      fields: [peopleSabbathSchoolClasses.personId],
      references: [people.id],
    }),
    sabbathSchoolClass: one(sabbathSchoolClasses, {
      fields: [peopleSabbathSchoolClasses.sabbathSchoolClassId],
      references: [sabbathSchoolClasses.id],
    }),
  })
);

export const relationshipsRelations = relations(relationships, ({ one }) => ({
  person: one(people, {
    fields: [relationships.personId],
    references: [people.id],
    relationName: "subject",
  }),
  relatedPerson: one(people, {
    fields: [relationships.relatedPersonId],
    references: [people.id],
    relationName: "related",
  }),
}));
