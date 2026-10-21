CREATE TABLE `departments` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text(255) NOT NULL,
	`description` text,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `departments_name_unique` ON `departments` (`name`);--> statement-breakpoint
CREATE TABLE `groups` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text(255) NOT NULL,
	`description` text,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `groups_name_unique` ON `groups` (`name`);--> statement-breakpoint
CREATE TABLE `households` (
	`id` text PRIMARY KEY NOT NULL,
	`family_name` text(255),
	`address_line_1` text(255),
	`address_line_2` text(255),
	`city` text(100),
	`state` text(100),
	`country` text(100),
	`phone` text(50),
	`preferred_visiting_time` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `people_departments` (
	`id` text PRIMARY KEY NOT NULL,
	`person_id` text NOT NULL,
	`department_id` text NOT NULL,
	`joined_at` text,
	`left_at` text,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`person_id`) REFERENCES `people`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`department_id`) REFERENCES `departments`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `people_groups` (
	`id` text PRIMARY KEY NOT NULL,
	`person_id` text NOT NULL,
	`group_id` text NOT NULL,
	`joined_at` text,
	`left_at` text,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`person_id`) REFERENCES `people`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`group_id`) REFERENCES `groups`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `people` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`first_name` text(100) NOT NULL,
	`last_name` text(100),
	`preferred_name` text(100),
	`gender` text,
	`date_of_birth` text,
	`photo_url` text,
	`email` text(255),
	`phone` text(50),
	`address_line_1` text(255),
	`address_line_2` text(255),
	`city` text(100),
	`state` text(100),
	`country` text(100),
	`occupation` text(255),
	`fathers_name` text(255),
	`mothers_name` text(255),
	`marital_status` text NOT NULL,
	`wedding_date` text,
	`memorial_day` text,
	`membership_status` text NOT NULL,
	`baptism_date` text,
	`baptism_place` text(255),
	`date_joined_church` text,
	`sabbath_school_class` text,
	`dietary_preference` text,
	`preferred_visiting_time` text,
	`important_dates` text,
	`visitation_notes` text,
	`pastoral_notes` text,
	`household_id` text,
	`household_role` text,
	`is_active` integer DEFAULT true NOT NULL,
	`identity_last_name` text GENERATED ALWAYS AS (coalesce(last_name, '')) STORED,
	`identity_date_of_birth` text GENERATED ALWAYS AS (coalesce(date_of_birth, '')) STORED,
	FOREIGN KEY (`household_id`) REFERENCES `households`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `people_email_unique` ON `people` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `unique_person_identity` ON `people` (`first_name`,`identity_last_name`,`identity_date_of_birth`);--> statement-breakpoint
CREATE TABLE `position_history` (
	`id` text PRIMARY KEY NOT NULL,
	`person_id` text NOT NULL,
	`position_id` text NOT NULL,
	`term_start` text NOT NULL,
	`term_end` text,
	`notes` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`person_id`) REFERENCES `people`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`position_id`) REFERENCES `positions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `positions` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text(255) NOT NULL,
	`description` text,
	`department_id` text,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`department_id`) REFERENCES `departments`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `positions_name_unique` ON `positions` (`name`);--> statement-breakpoint
CREATE TABLE `relationships` (
	`id` text PRIMARY KEY NOT NULL,
	`person_id` text NOT NULL,
	`related_person_id` text NOT NULL,
	`type` text NOT NULL,
	`state` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`person_id`) REFERENCES `people`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`related_person_id`) REFERENCES `people`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `unique_relationship` ON `relationships` (`person_id`,`related_person_id`,`type`);