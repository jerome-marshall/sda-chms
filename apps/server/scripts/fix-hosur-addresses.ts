import dotenv from "dotenv";

dotenv.config({ path: ".env" });

import { and, db, eq, ilike, isNotNull } from "@sda-chms/db";
import { peopleTable } from "@sda-chms/db/schema/people";

/**
 * Temporary script to fix addresses containing "Hosur" in addressLine1.
 *
 * For records where addressLine1 contains "Hosur":
 * - Removes "Hosur" from addressLine1 (with proper whitespace cleanup)
 * - Sets city = "Hosur"
 * - Sets state = "Tamil Nadu"
 * - Sets country = "India"
 */
async function fixHosurAddresses() {
  console.log("Starting address fix for Hosur records...\n");

  // Find all people with addressLine1 containing "Hosur" (case-insensitive)
  const peopleWithHosur = await db
    .select({
      id: peopleTable.id,
      firstName: peopleTable.firstName,
      lastName: peopleTable.lastName,
      addressLine1: peopleTable.addressLine1,
      city: peopleTable.city,
      state: peopleTable.state,
      country: peopleTable.country,
    })
    .from(peopleTable)
    .where(
      and(
        isNotNull(peopleTable.addressLine1),
        ilike(peopleTable.addressLine1, "%Hosur%")
      )
    );

  console.log(
    `Found ${peopleWithHosur.length} records with "Hosur" in addressLine1\n`
  );

  if (peopleWithHosur.length === 0) {
    console.log("No records to update. Exiting.");
    return;
  }

  let updated = 0;
  let errors = 0;

  for (const person of peopleWithHosur) {
    try {
      // Remove "Hosur" from addressLine1 (case-insensitive, with whitespace cleanup)
      const currentAddress = person.addressLine1 ?? "";
      const cleanedAddress = currentAddress
        .replace(/\bHosur\b/gi, "") // Remove "Hosur" word (case-insensitive, whole word)
        .replace(/\s+/g, " ") // Replace multiple spaces with single space
        .replace(/^[\s,]+|[\s,]+$/g, "") // Remove leading/trailing spaces and commas
        .trim();

      await db
        .update(peopleTable)
        .set({
          addressLine1: cleanedAddress || null,
          city: "Hosur",
          state: "Tamil Nadu",
          country: "India",
        })
        .where(eq(peopleTable.id, person.id));

      console.log(`✓ Updated: ${person.firstName} ${person.lastName ?? ""}`);
      console.log(`  Before: ${person.addressLine1}`);
      console.log(`  After:  ${cleanedAddress || "(empty)"}`);
      console.log("  City:   Hosur, State: Tamil Nadu, Country: India\n");

      updated++;
    } catch (error) {
      const err = error instanceof Error ? error.message : String(error);
      console.error(
        `✗ Error updating ${person.firstName} ${person.lastName ?? ""}: ${err}`
      );
      errors++;
    }
  }

  console.log("\n========== UPDATE SUMMARY ==========");
  console.log(`Records found:    ${peopleWithHosur.length}`);
  console.log(`Records updated:  ${updated}`);
  console.log(`Errors:           ${errors}`);
  console.log("====================================\n");
}

fixHosurAddresses()
  .then(() => {
    console.log("Script completed successfully.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Script failed:", error);
    process.exit(1);
  });
