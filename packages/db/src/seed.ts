// Load environment variables FIRST before any imports that depend on them
import dotenv from "dotenv";

dotenv.config({
  path: "../../apps/server/.env",
});

import { faker } from "@faker-js/faker";
import {
  DIETARY_PREFERENCES_VALUES,
  GENDER_VALUES,
  MARITAL_STATUS_VALUES,
  MEMBERSHIP_STATUS_VALUES,
  SABBATH_SCHOOL_CLASS,
} from "@sda-chms/shared/constants/people";
import { drizzle } from "drizzle-orm/node-postgres";
// biome-ignore lint/performance/noNamespaceImport: <import schema>
import * as schema from "./schema/index.js";
import { peopleTable } from "./schema/people.js";

// Create database connection after env is loaded
if (!process.env.DATABASE_URL) {
  console.error("Error: DATABASE_URL environment variable is not set");
  process.exit(1);
}

const db = drizzle(process.env.DATABASE_URL, { schema });

// ============================================================================
// SOUTH INDIAN NAME DATA
// ============================================================================

const SOUTH_INDIAN_MALE_FIRST_NAMES = [
  "Arjun",
  "Karthik",
  "Venkatesh",
  "Suresh",
  "Ramesh",
  "Prakash",
  "Vijay",
  "Kumar",
  "Rajan",
  "Selvam",
  "Murugan",
  "Senthil",
  "Bala",
  "Arun",
  "Dinesh",
  "Ganesh",
  "Hari",
  "Jeyakumar",
  "Kannan",
  "Lakshman",
  "Manoj",
  "Nagaraj",
  "Pandian",
  "Rajesh",
  "Sathish",
  "Thirumurugan",
  "Udhaya",
  "Velu",
  "Anand",
  "Bharath",
  "Chandran",
  "Dhanush",
  "Elango",
  "Gokul",
  "Iniyan",
  "Jeeva",
  "Karthikeyan",
  "Logesh",
  "Muthu",
  "Naveen",
  "Prabhu",
  "Raghu",
  "Samuel",
  "Thomas",
  "Daniel",
  "David",
  "Emmanuel",
  "Joseph",
  "Joshua",
  "Benjamin",
];

const SOUTH_INDIAN_FEMALE_FIRST_NAMES = [
  "Priya",
  "Lakshmi",
  "Saranya",
  "Divya",
  "Meena",
  "Kavitha",
  "Sujatha",
  "Revathi",
  "Geetha",
  "Anitha",
  "Banu",
  "Chitra",
  "Deepa",
  "Eswari",
  "Fathima",
  "Gayathri",
  "Hemalatha",
  "Indira",
  "Jayanthi",
  "Kamala",
  "Lalitha",
  "Mangai",
  "Nirmala",
  "Padma",
  "Radha",
  "Saraswathi",
  "Thenmozhi",
  "Uma",
  "Vasantha",
  "Yamuna",
  "Aishwarya",
  "Bhavani",
  "Chithra",
  "Dhanalakshmi",
  "Eshwari",
  "Gowri",
  "Harini",
  "Janani",
  "Keerthana",
  "Lavanya",
  "Mary",
  "Sarah",
  "Elizabeth",
  "Rachel",
  "Ruth",
  "Esther",
  "Deborah",
  "Rebecca",
  "Hannah",
  "Grace",
];

const SOUTH_INDIAN_LAST_NAMES = [
  "Krishnamurthy",
  "Ramasamy",
  "Subramanian",
  "Venkataraman",
  "Natarajan",
  "Sundaram",
  "Palani",
  "Murugesan",
  "Balakrishnan",
  "Govindaraj",
  "Arumugam",
  "Chidambaram",
  "Duraisamy",
  "Elangovan",
  "Gurusamy",
  "Hariharan",
  "Iyengar",
  "Jayaraman",
  "Kumarasamy",
  "Lakshmanan",
  "Manikandan",
  "Narayanan",
  "Pandiarajan",
  "Rajendran",
  "Saravanan",
  "Thirunavukkarasu",
  "Udayakumar",
  "Velayutham",
  "Wilson",
  "Abraham",
  "Isaac",
  "Jacob",
  "Solomon",
  "Moses",
  "Aaron",
  "Peter",
  "Paul",
  "John",
  "James",
  "Philip",
  "Devaraj",
  "Jebaraj",
  "Immanuel",
  "Christudas",
  "Dayalan",
  "Jesuraj",
  "Paulraj",
  "Selvaraj",
  "Sunder",
  "Victor",
];

const SOUTH_INDIAN_CITIES = [
  "Hosur",
  "Chennai",
  "Bangalore",
  "Coimbatore",
  "Madurai",
  "Trichy",
  "Salem",
  "Tirunelveli",
  "Vellore",
  "Erode",
  "Thanjavur",
  "Dindigul",
  "Nagercoil",
  "Kanyakumari",
  "Pondicherry",
  "Krishnagiri",
  "Dharmapuri",
  "Karur",
  "Namakkal",
  "Tirupur",
];

const SOUTH_INDIAN_OCCUPATIONS = [
  "Software Engineer",
  "Teacher",
  "Doctor",
  "Nurse",
  "Bank Manager",
  "Accountant",
  "Business Owner",
  "Government Employee",
  "Farmer",
  "Pastor",
  "Evangelist",
  "Bible Worker",
  "College Professor",
  "School Principal",
  "Hospital Administrator",
  "Pharmacist",
  "Civil Engineer",
  "Architect",
  "Lawyer",
  "Chartered Accountant",
  "IT Consultant",
  "Data Analyst",
  "HR Manager",
  "Sales Manager",
  "Marketing Executive",
  "Mechanical Engineer",
  "Electrical Engineer",
  "Textile Worker",
  "Auto Driver",
  "Shop Owner",
  "Homemaker",
  "Retired",
  "Student",
  "Self Employed",
  "Construction Worker",
];

const SOUTH_INDIAN_STREETS = [
  "Gandhi Nagar",
  "Anna Nagar",
  "Nehru Street",
  "Rajaji Road",
  "Kamaraj Salai",
  "Periyar Street",
  "EVR Road",
  "Thiruvalluvar Street",
  "Bharathi Nagar",
  "Ambedkar Colony",
  "Patel Nagar",
  "Indira Nagar",
  "MGR Nagar",
  "Jayalalitha Street",
  "Srinivasa Nagar",
  "Lakshmi Nagar",
  "Vinayagar Koil Street",
  "Temple Street",
  "Church Road",
  "Mission Compound",
  "New Colony",
  "Old Town",
  "Main Road",
  "Cross Street",
  "Back Street",
];

const BAPTISM_PLACES = [
  "SDA Church Hosur",
  "SDA Church Chennai",
  "SDA Church Bangalore",
  "SDA Church Coimbatore",
  "SDA Church Madurai",
  "SDA Church Trichy",
  "Lowry Memorial College",
  "Spicer Adventist University",
  "Camp Meeting Ground",
  "Local River",
  "Baptismal Tank",
];

const VISITATION_NOTES_TEMPLATES = [
  "Family doing well spiritually. Continue regular visits.",
  "Needs prayer support for health issues.",
  "Recently started attending Sabbath School regularly.",
  "Interested in joining a small group.",
  "Family facing financial difficulties. Referred to welfare committee.",
  "Children actively involved in Pathfinder club.",
  "Expressed interest in Bible study.",
  "Recently moved to the area. Helping them settle in.",
  "Active in community outreach programs.",
  "Needs transportation assistance for church services.",
  null,
  null,
  null,
];

const PASTORAL_NOTES_TEMPLATES = [
  "Strong faith and commitment to the church.",
  "Going through a difficult season. Regular follow-up needed.",
  "Potential leader for youth ministry.",
  "Faithful in tithe and offerings.",
  "Could benefit from membership in prayer group.",
  "Recently recommitted life to Christ.",
  "Active in personal evangelism.",
  "Mentoring new believers.",
  null,
  null,
  null,
  null,
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

// Reference date: January 6, 2026
const REFERENCE_DATE = new Date("2026-01-06");

function getSouthIndianFirstName(gender: string): string {
  if (gender === "male") {
    return faker.helpers.arrayElement(SOUTH_INDIAN_MALE_FIRST_NAMES);
  }
  if (gender === "female") {
    return faker.helpers.arrayElement(SOUTH_INDIAN_FEMALE_FIRST_NAMES);
  }
  return faker.helpers.arrayElement([
    ...SOUTH_INDIAN_MALE_FIRST_NAMES,
    ...SOUTH_INDIAN_FEMALE_FIRST_NAMES,
  ]);
}

function formatDate(date: Date): string {
  const dateStr = date.toISOString().split("T")[0];
  if (!dateStr) {
    throw new Error("Invalid date format");
  }
  return dateStr;
}

function calculateAge(dateOfBirth: Date, referenceDate: Date): number {
  let age = referenceDate.getFullYear() - dateOfBirth.getFullYear();
  const monthDiff = referenceDate.getMonth() - dateOfBirth.getMonth();
  const dayDiff = referenceDate.getDate() - dateOfBirth.getDate();

  // Adjust age if birthday hasn't occurred yet this year
  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    age--;
  }

  return age;
}

function getSabbathSchoolClass(
  dateOfBirth: Date
): (typeof SABBATH_SCHOOL_CLASS)[keyof typeof SABBATH_SCHOOL_CLASS] {
  const age = calculateAge(dateOfBirth, REFERENCE_DATE);

  // Beginners: birth-3 years (0-3 years old)
  if (age <= 3) {
    return SABBATH_SCHOOL_CLASS.BEGINNER;
  }
  // Kindergarten: 4-5 years old
  if (age >= 4 && age <= 5) {
    return SABBATH_SCHOOL_CLASS.KINDERGARTEN;
  }
  // Primary: 6-8 years old
  if (age >= 6 && age <= 8) {
    return SABBATH_SCHOOL_CLASS.PRIMARY;
  }
  // Juniors: 9-11 years old
  if (age >= 9 && age <= 11) {
    return SABBATH_SCHOOL_CLASS.JUNIOR;
  }
  // Earliteen: 12-13 years old
  if (age >= 12 && age <= 13) {
    return SABBATH_SCHOOL_CLASS.EARLITEEN;
  }
  // Youth: 14-18 years old
  if (age >= 14 && age <= 18) {
    return SABBATH_SCHOOL_CLASS.YOUTH;
  }
  // Adult: 18+ years old
  return SABBATH_SCHOOL_CLASS.ADULT;
}

function generateEmail(firstName: string, lastName: string): string | null {
  // 70% chance of having an email
  if (faker.number.float() > 0.7) {
    return null;
  }

  const domains = ["gmail.com", "yahoo.com", "outlook.com", "hotmail.com"];
  const domain = faker.helpers.arrayElement(domains);
  const separator = faker.helpers.arrayElement([".", "_", ""]);
  const number = faker.number.int({ min: 1, max: 999 });

  return `${firstName.toLowerCase()}${separator}${lastName.toLowerCase()}${number}@${domain}`;
}

function generatePhotoUrl(): string | null {
  // 30% chance of having a photo
  if (faker.number.float() > 0.3) {
    return null;
  }
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${faker.string.uuid()}`;
}

function generateWeddingDate(
  maritalStatus: string,
  dateOfBirth: Date
): string | null {
  if (maritalStatus !== "married") {
    return null;
  }

  // Wedding date should be 20-30 years after birth
  const minWeddingDate = new Date(dateOfBirth);
  minWeddingDate.setFullYear(minWeddingDate.getFullYear() + 20);

  const maxWeddingDate = new Date(dateOfBirth);
  maxWeddingDate.setFullYear(maxWeddingDate.getFullYear() + 30);

  // If person is less than 20 years old, don't generate wedding date
  if (minWeddingDate > REFERENCE_DATE) {
    return null;
  }

  // Use the earlier of maxWeddingDate or reference date
  const toDate =
    maxWeddingDate > REFERENCE_DATE ? REFERENCE_DATE : maxWeddingDate;

  // If minWeddingDate is after toDate, return null
  if (minWeddingDate > toDate) {
    return null;
  }

  const weddingDate = faker.date.between({
    from: minWeddingDate,
    to: toDate,
  });
  return formatDate(weddingDate);
}

function generateMemorialDay(dateOfBirth: Date): string | null {
  // 10% chance of having a memorial day (for deceased family member remembrance)
  if (faker.number.float() > 0.1) {
    return null;
  }

  // Memorial day should be sometime after the birthday (for remembering a deceased relative)
  // Typically 5-50 years after birth (representing when a family member passed)
  const minMemorialDate = new Date(dateOfBirth);
  minMemorialDate.setFullYear(minMemorialDate.getFullYear() + 5);

  // If person is less than 5 years old, don't generate memorial day
  if (minMemorialDate > REFERENCE_DATE) {
    return null;
  }

  const maxMemorialDate = new Date(dateOfBirth);
  maxMemorialDate.setFullYear(maxMemorialDate.getFullYear() + 50);

  // Use the earlier of maxMemorialDate or reference date
  const toDate =
    maxMemorialDate > REFERENCE_DATE ? REFERENCE_DATE : maxMemorialDate;

  // If minMemorialDate is after toDate, return null
  if (minMemorialDate > toDate) {
    return null;
  }

  const memorialDate = faker.date.between({
    from: minMemorialDate,
    to: toDate,
  });
  return formatDate(memorialDate);
}

function generateBaptismDate(dateOfBirth: Date): string | null {
  // 85% chance of having a baptism date
  if (faker.number.float() > 0.85) {
    return null;
  }

  // Baptism should be after 8 years of age (typical SDA practice)
  const minBaptismDate = new Date(dateOfBirth);
  minBaptismDate.setFullYear(minBaptismDate.getFullYear() + 8);

  if (minBaptismDate > REFERENCE_DATE) {
    return null;
  }

  const baptismDate = faker.date.between({
    from: minBaptismDate,
    to: REFERENCE_DATE,
  });
  return formatDate(baptismDate);
}

function generateDateJoinedChurch(baptismDate: string | null): string | null {
  if (!baptismDate) {
    return null;
  }

  // Usually join date is same as baptism or slightly after (for transfers)
  const baptism = new Date(baptismDate);
  const shouldTransfer = faker.number.float() < 0.2; // 20% are transfers

  if (shouldTransfer) {
    const joinDate = faker.date.between({ from: baptism, to: REFERENCE_DATE });
    return formatDate(joinDate);
  }
  return baptismDate;
}

function createRandomPerson() {
  const gender = faker.helpers.arrayElement(GENDER_VALUES);
  // Generate a specific birth date relative to 2026-01-06
  // Ages range from 16 to 76 years old (born between 1950-2010)
  const dateOfBirth = faker.date.birthdate({
    min: 16,
    max: 76,
    mode: "age",
    refDate: REFERENCE_DATE,
  });

  const firstName = getSouthIndianFirstName(gender);
  const lastName = faker.helpers.arrayElement(SOUTH_INDIAN_LAST_NAMES);

  // Generate 10-digit phone number starting with Indian mobile prefixes
  const mobilePrefix = faker.helpers.arrayElement([
    "70",
    "72",
    "73",
    "74",
    "75",
    "76",
    "77",
    "78",
    "79",
    "80",
    "81",
    "82",
    "83",
    "84",
    "85",
    "86",
    "87",
    "88",
    "89",
    "90",
    "91",
    "92",
    "93",
    "94",
    "95",
    "96",
    "97",
    "98",
    "99",
  ]);
  const phone = `${mobilePrefix}${faker.string.numeric(8)}`;

  const maritalStatus = faker.helpers.arrayElement(MARITAL_STATUS_VALUES);
  const baptismDate = generateBaptismDate(dateOfBirth);

  // Preferred name - 20% chance
  const preferredName =
    faker.number.float() < 0.2
      ? faker.helpers.arrayElement([
          firstName.substring(0, 3),
          `${firstName.charAt(0)}K`,
          firstName,
        ])
      : null;

  // Address Line 2 - 40% chance
  const addressLine2 =
    faker.number.float() < 0.4
      ? faker.helpers.arrayElement([
          "Near Bus Stand",
          "Opposite Church",
          "Behind Temple",
          "Near School",
          "Near Hospital",
          "1st Floor",
          "2nd Floor",
          "Ground Floor",
          null,
        ])
      : null;

  return {
    // Basic Info
    firstName,
    lastName,
    preferredName,
    gender,
    dateOfBirth: formatDate(dateOfBirth),
    photoUrl: generatePhotoUrl(),

    // Contact Info
    email: generateEmail(firstName, lastName),
    phone,

    // Address
    addressLine1: `${faker.number.int({ min: 1, max: 150 })}, ${faker.helpers.arrayElement(SOUTH_INDIAN_STREETS)}`,
    addressLine2,
    city: faker.helpers.arrayElement(SOUTH_INDIAN_CITIES),
    state: "Tamil Nadu",
    country: "India",

    // Personal Details
    occupation: faker.helpers.arrayElement(SOUTH_INDIAN_OCCUPATIONS),
    maritalStatus,
    weddingDate: generateWeddingDate(maritalStatus, dateOfBirth),
    memorialDay: generateMemorialDay(dateOfBirth),

    // Church Membership
    membershipStatus: faker.helpers.arrayElement(MEMBERSHIP_STATUS_VALUES),
    baptismDate,
    baptismPlace: baptismDate
      ? faker.helpers.arrayElement(BAPTISM_PLACES)
      : null,
    dateJoinedChurch: generateDateJoinedChurch(baptismDate),
    sabbathSchoolClass: getSabbathSchoolClass(dateOfBirth),

    // Preferences
    dietaryPreference: faker.helpers.arrayElement(DIETARY_PREFERENCES_VALUES),

    // Private Notes
    visitationNotes: faker.helpers.arrayElement(VISITATION_NOTES_TEMPLATES),
    pastoralNotes: faker.helpers.arrayElement(PASTORAL_NOTES_TEMPLATES),

    // Soft delete
    isActive: faker.number.float() < 0.95, // 95% are active
  };
}

async function seed() {
  const count = Number.parseInt(process.argv[2] || "100", 10);

  console.log(`Generating ${count} people...`);

  const people = faker.helpers.multiple(createRandomPerson, { count });

  console.log(`Inserting ${people.length} people into database...`);

  try {
    await db.insert(peopleTable).values(people);
    console.log(`Successfully seeded ${people.length} people!`);
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }

  process.exit(0);
}

seed();
