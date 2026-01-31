CREATE EXTENSION vector;

CREATE TYPE "public"."gender" AS ENUM('male', 'female', 'other');--> statement-breakpoint
CREATE TYPE "public"."household_role" AS ENUM('head', 'spouse', 'child', 'other');--> statement-breakpoint
CREATE TYPE "public"."marital_status" AS ENUM('single', 'married', 'divorced', 'widowed', 'separated');--> statement-breakpoint
CREATE TYPE "public"."membership_status" AS ENUM('member', 'regular_attendee', 'visitor', 'inactive', 'moved', 'deceased');--> statement-breakpoint
CREATE TYPE "public"."relationship_type" AS ENUM('parent', 'child', 'spouse', 'sibling', 'grandparent', 'grandchild', 'other');--> statement-breakpoint
CREATE TYPE "public"."sabbath_school_class" AS ENUM('beginner', 'kindergarten', 'primary', 'junior', 'earliteen', 'youth', 'adult');--> statement-breakpoint
CREATE TABLE "departments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "departments_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "groups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "groups_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "households" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"address_line_1" varchar(255),
	"address_line_2" varchar(255),
	"city" varchar(100),
	"state" varchar(100),
	"country" varchar(100),
	"phone" varchar(50),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "people_departments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"person_id" uuid NOT NULL,
	"department_id" uuid NOT NULL,
	"role" varchar(100),
	"joined_at" date,
	"left_at" date,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "people_groups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"person_id" uuid NOT NULL,
	"group_id" uuid NOT NULL,
	"joined_at" date,
	"left_at" date,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "people" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"first_name" varchar(100) NOT NULL,
	"last_name" varchar(100) NOT NULL,
	"preferred_name" varchar(100),
	"gender" "gender",
	"date_of_birth" date,
	"photo_url" text,
	"email" varchar(255),
	"phone" varchar(50) NOT NULL,
	"address_line_1" varchar(255),
	"address_line_2" varchar(255),
	"city" varchar(100),
	"state" varchar(100),
	"country" varchar(100),
	"occupation" varchar(255) NOT NULL,
	"marital_status" "marital_status" NOT NULL,
	"wedding_date" date,
	"memorial_day" date,
	"membership_status" "membership_status" NOT NULL,
	"baptism_date" date,
	"baptism_place" varchar(255),
	"date_joined_church" date,
	"sabbath_school_class" "sabbath_school_class" NOT NULL,
	"dietary_preference" text,
	"preferred_visiting_time" text,
	"visitation_notes" text,
	"pastoral_notes" text,
	"household_id" uuid,
	"household_role" "household_role",
	"is_active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "people_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "position_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"person_id" uuid NOT NULL,
	"position_id" uuid NOT NULL,
	"term_start" date NOT NULL,
	"term_end" date,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "positions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"department_id" uuid,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "positions_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "relationships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"person_id" uuid NOT NULL,
	"related_person_id" uuid NOT NULL,
	"relationship_type" "relationship_type" NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "people_departments" ADD CONSTRAINT "people_departments_person_id_people_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."people"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "people_departments" ADD CONSTRAINT "people_departments_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "people_groups" ADD CONSTRAINT "people_groups_person_id_people_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."people"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "people_groups" ADD CONSTRAINT "people_groups_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "position_history" ADD CONSTRAINT "position_history_person_id_people_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."people"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "position_history" ADD CONSTRAINT "position_history_position_id_positions_id_fk" FOREIGN KEY ("position_id") REFERENCES "public"."positions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "positions" ADD CONSTRAINT "positions_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "relationships" ADD CONSTRAINT "relationships_person_id_people_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."people"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "relationships" ADD CONSTRAINT "relationships_related_person_id_people_id_fk" FOREIGN KEY ("related_person_id") REFERENCES "public"."people"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "unique_person_identity" ON "people" USING btree ("first_name","last_name","date_of_birth");