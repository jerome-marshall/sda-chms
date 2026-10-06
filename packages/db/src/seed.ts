import { faker } from "@faker-js/faker";
import {
  DIETARY_PREFERENCES_VALUES,
  GENDER_VALUES,
  HOUSEHOLD_ROLE,
  IMPORTANT_DATE_CATEGORY,
  IMPORTANT_DATE_RECURRENCE,
  MARITAL_STATUS,
  type MARITAL_STATUS_VALUES,
  MEMBERSHIP_STATUS,
  type MEMBERSHIP_STATUS_VALUES,
  RELATIONSHIP_TYPE,
  SPOUSE_STATE,
  type SPOUSE_STATE_VALUES,
} from "@sda-chms/shared/constants/people";
import type { ImportantDate } from "@sda-chms/shared/schema/people";
import { getSabbathSchoolClass } from "@sda-chms/shared/utils/sabbath-school";
import dotenv from "dotenv";
import { count } from "drizzle-orm";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
// biome-ignore lint/performance/noNamespaceImport: <import schema>
import * as schema from "./schema/index.js";
import {
  departmentsTable,
  groupsTable,
  type HouseholdsInsertDb,
  householdsTable,
  type PeopleInsertDb,
  peopleDepartmentsTable,
  peopleGroupsTable,
  peopleTable,
  positionHistoryTable,
  positionsTable,
  relationshipsTable,
} from "./schema/people.js";

// ============================================================================
// SOUTH INDIAN NAME DATA (Hosur, Tamil Nadu congregation)
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
  "Hosur",
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

const VISITING_TIMES = [
  "Sabbath afternoons",
  "Weekday evenings",
  "Sunday mornings",
  "Saturday evenings",
  "Anytime",
];

// ============================================================================
// MINISTRY STRUCTURE SEED DATA (from CONTEXT.md domain language)
// ============================================================================

const SEED_GROUPS = [
  { name: "Choir", description: "Church choir for Sabbath worship services." },
  {
    name: "Prayer Band",
    description: "Mid-week prayer fellowship circle.",
  },
  {
    name: "Pathfinder Club",
    description: "Youth discipleship and outdoor activities club.",
  },
  {
    name: "Bible Study Circle",
    description: "Small-group Bible study meeting in homes.",
  },
  {
    name: "Community Outreach",
    description: "Neighbourhood service and evangelism volunteers.",
  },
  {
    name: "Women's Ministry Group",
    description: "Fellowship and support circle for women.",
  },
  {
    name: "Men's Fellowship",
    description: "Fellowship and support circle for men.",
  },
  {
    name: "Youth Small Group",
    description: "Informal gathering for young adults.",
  },
];

const SEED_DEPARTMENTS = [
  {
    name: "Sabbath School",
    description: "Saturday-morning Bible-study program.",
  },
  { name: "Youth", description: "Youth and young-adult ministry." },
  { name: "Music", description: "Worship music and choir oversight." },
  {
    name: "Personal Ministries",
    description: "Outreach, evangelism and community service.",
  },
  {
    name: "Health Ministries",
    description: "Health education and temperance.",
  },
  {
    name: "Children's Ministries",
    description: "Ministry for children aged 0-14.",
  },
  {
    name: "Communication",
    description: "Announcements, bulletin and media.",
  },
  {
    name: "Hospitality",
    description: "Welcome, ushering and fellowship meals.",
  },
];

const SEED_POSITIONS: { name: string; department: string | null }[] = [
  { name: "Elder", department: null },
  { name: "Deacon", department: null },
  { name: "Deaconess", department: null },
  { name: "Clerk", department: null },
  { name: "Treasurer", department: null },
  { name: "Sabbath School Superintendent", department: "Sabbath School" },
  { name: "Youth Leader", department: "Youth" },
  { name: "Music Director", department: "Music" },
  { name: "Personal Ministries Leader", department: "Personal Ministries" },
  { name: "Health Ministries Leader", department: "Health Ministries" },
  {
    name: "Children's Ministries Coordinator",
    department: "Children's Ministries",
  },
  { name: "Communications Secretary", department: "Communication" },
  { name: "Pathfinder Director", department: "Youth" },
  { name: "Hospitality Coordinator", department: "Hospitality" },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

// Reference date: January 6, 2026. Built from numeric parts (local time) rather
// than an ISO string (which parses as UTC) so age math lines up with the local
// date accessors used downstream regardless of the runner's timezone.
const REFERENCE_DATE = new Date(2026, 0, 6);
const DAY_MS = 24 * 60 * 60 * 1000;

type MembershipStatus = (typeof MEMBERSHIP_STATUS_VALUES)[number];

function pick<T>(values: readonly T[]): T {
  const value = faker.helpers.arrayElement(values);
  if (value === undefined) {
    throw new Error("Cannot pick from an empty array");
  }
  return value;
}

function getSouthIndianFirstName(gender: string): string {
  if (gender === "male") {
    return pick(SOUTH_INDIAN_MALE_FIRST_NAMES);
  }
  if (gender === "female") {
    return pick(SOUTH_INDIAN_FEMALE_FIRST_NAMES);
  }
  return pick([
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

/** Date of birth for someone of exactly `age` years on the reference date. */
function dobForAge(age: number): Date {
  return faker.date.birthdate({
    min: age,
    max: age,
    mode: "age",
    refDate: REFERENCE_DATE,
  });
}

function ageOn(dateOfBirth: Date): number {
  const age = REFERENCE_DATE.getFullYear() - dateOfBirth.getFullYear();
  const birthdayPassed =
    REFERENCE_DATE.getMonth() > dateOfBirth.getMonth() ||
    (REFERENCE_DATE.getMonth() === dateOfBirth.getMonth() &&
      REFERENCE_DATE.getDate() >= dateOfBirth.getDate());
  return birthdayPassed ? age : age - 1;
}

function generatePhone(): string {
  const mobilePrefix = pick([
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
  return `${mobilePrefix}${faker.string.numeric(8)}`;
}

function generateEmail(firstName: string, lastName: string): string | null {
  // 70% chance of having an email
  if (faker.number.float() > 0.7) {
    return null;
  }

  const domains = ["gmail.com", "yahoo.com", "outlook.com", "hotmail.com"];
  const domain = pick(domains);
  const separator = pick([".", "_", ""]);
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
  dateOfBirth: Date,
  latest: Date = REFERENCE_DATE
): string | null {
  // Wedding between age 20 and 30, never after `latest` (e.g. eldest child's birth).
  const minWeddingDate = new Date(dateOfBirth);
  minWeddingDate.setFullYear(minWeddingDate.getFullYear() + 20);

  const maxWeddingDate = new Date(dateOfBirth);
  maxWeddingDate.setFullYear(maxWeddingDate.getFullYear() + 30);

  const toDate = maxWeddingDate > latest ? latest : maxWeddingDate;
  if (minWeddingDate > toDate) {
    return null;
  }
  return formatDate(faker.date.between({ from: minWeddingDate, to: toDate }));
}

/**
 * Memorial Day is the date a Person passed away (recorded only when Membership
 * Status is Deceased) — not a general remembrance date on living People.
 */
function generateMemorialDay(): string {
  const from = new Date(REFERENCE_DATE.getTime() - 5 * 365 * DAY_MS);
  return formatDate(faker.date.between({ from, to: REFERENCE_DATE }));
}

function generateBaptismDate(
  dateOfBirth: Date,
  latest: Date = REFERENCE_DATE
): string | null {
  // 85% chance of having a baptism date
  if (faker.number.float() > 0.85) {
    return null;
  }

  // Baptism after 8 years of age (typical SDA practice)
  const minBaptismDate = new Date(dateOfBirth);
  minBaptismDate.setFullYear(minBaptismDate.getFullYear() + 8);

  if (minBaptismDate > latest) {
    return null;
  }
  return formatDate(faker.date.between({ from: minBaptismDate, to: latest }));
}

function generateDateJoinedChurch(
  baptismDate: string | null,
  latest: Date = REFERENCE_DATE
): string | null {
  if (!baptismDate) {
    return null;
  }

  // Usually join date is same as baptism or slightly after (for transfers)
  const baptism = new Date(baptismDate);
  const shouldTransfer = faker.number.float() < 0.2; // 20% are transfers

  if (shouldTransfer) {
    return formatDate(faker.date.between({ from: baptism, to: latest }));
  }
  return baptismDate;
}

function adultMembershipStatus(age: number): MembershipStatus {
  const entries: { weight: number; value: MembershipStatus }[] = [
    { weight: 65, value: MEMBERSHIP_STATUS.MEMBER },
    { weight: 15, value: MEMBERSHIP_STATUS.REGULAR_ATTENDEE },
    { weight: 8, value: MEMBERSHIP_STATUS.VISITOR },
    { weight: 5, value: MEMBERSHIP_STATUS.INACTIVE },
    { weight: 4, value: MEMBERSHIP_STATUS.MOVED },
  ];
  // Only the elderly pass away in seed data.
  if (age >= 65) {
    entries.push({ weight: 3, value: MEMBERSHIP_STATUS.DECEASED });
  }
  return faker.helpers.weightedArrayElement(entries);
}

function childMembershipStatus(): MembershipStatus {
  return faker.helpers.weightedArrayElement([
    { weight: 70, value: MEMBERSHIP_STATUS.MEMBER },
    { weight: 20, value: MEMBERSHIP_STATUS.REGULAR_ATTENDEE },
    { weight: 10, value: MEMBERSHIP_STATUS.VISITOR },
  ]);
}

// ============================================================================
// FAMILY PLANNING (in-memory, then inserted)
// ============================================================================

type PersonDraft = Omit<PeopleInsertDb, "householdId"> & {
  householdId?: string;
};

type FamilyRole = "head" | "spouse" | "child";

interface FamilyMember {
  /** Kept alongside (not inside) the draft so inserts stay pure insert shapes. */
  dob: Date;
  draft: PersonDraft;
  role: FamilyRole;
}

interface FamilyPlan {
  household: HouseholdsInsertDb;
  members: FamilyMember[];
}

function basePersonDraft(options: {
  firstName: string;
  lastName: string;
  gender: (typeof GENDER_VALUES)[number];
  dateOfBirth: Date;
  maritalStatus: (typeof MARITAL_STATUS_VALUES)[number];
  membershipStatus: MembershipStatus;
  weddingDate?: string | null;
  memorialDay?: string | null;
  occupation?: string | null;
  fathersName?: string | null;
  mothersName?: string | null;
  email?: string | null;
  phone?: string | null;
  importantDates?: ImportantDate[];
}): PersonDraft {
  const baptismCap = options.memorialDay
    ? new Date(`${options.memorialDay}T00:00:00`)
    : REFERENCE_DATE;
  const baptismDate =
    options.membershipStatus === MEMBERSHIP_STATUS.VISITOR &&
    faker.number.float() < 0.8
      ? null
      : generateBaptismDate(options.dateOfBirth, baptismCap);

  return {
    firstName: options.firstName,
    lastName: options.lastName,
    preferredName:
      faker.number.float() < 0.2
        ? pick([
            options.firstName.slice(0, 3),
            `${options.firstName.charAt(0)}K`,
            options.firstName,
          ])
        : null,
    gender: options.gender,
    dateOfBirth: formatDate(options.dateOfBirth),
    photoUrl: generatePhotoUrl(),
    email:
      options.email === undefined
        ? generateEmail(options.firstName, options.lastName)
        : options.email,
    // Phone/address live on the Household (ADR-0001) — person columns are
    // overrides, set explicitly per role below. Default to inheriting (null).
    phone: options.phone === undefined ? null : options.phone,
    addressLine1: null,
    addressLine2: null,
    city: null,
    state: null,
    country: null,
    occupation:
      options.occupation === undefined
        ? pick(SOUTH_INDIAN_OCCUPATIONS)
        : options.occupation,
    fathersName: options.fathersName ?? null,
    mothersName: options.mothersName ?? null,
    maritalStatus: options.maritalStatus,
    weddingDate: options.weddingDate ?? null,
    memorialDay: options.memorialDay ?? null,
    membershipStatus: options.membershipStatus,
    baptismDate,
    baptismPlace: baptismDate ? pick(BAPTISM_PLACES) : null,
    dateJoinedChurch: generateDateJoinedChurch(baptismDate, baptismCap),
    sabbathSchoolClass: getSabbathSchoolClass(
      options.dateOfBirth,
      REFERENCE_DATE
    ),
    dietaryPreference: pick(DIETARY_PREFERENCES_VALUES),
    preferredVisitingTime:
      faker.number.float() < 0.1 ? pick(VISITING_TIMES) : null,
    importantDates: options.importantDates ?? [],
    visitationNotes: pick(VISITATION_NOTES_TEMPLATES),
    pastoralNotes: pick(PASTORAL_NOTES_TEMPLATES),
    householdRole: HOUSEHOLD_ROLE.HEAD,
    isActive: faker.number.float() < 0.98,
  };
}

function planHousehold(lastName: string): HouseholdsInsertDb {
  return {
    familyName: `${lastName} Family`,
    addressLine1: `${faker.number.int({ min: 1, max: 150 })}, ${pick(SOUTH_INDIAN_STREETS)}`,
    addressLine2:
      faker.number.float() < 0.4
        ? pick([
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
        : null,
    city: pick(SOUTH_INDIAN_CITIES),
    state: "Tamil Nadu",
    country: "India",
    phone: generatePhone(),
    preferredVisitingTime: pick(VISITING_TIMES),
  };
}

/** Occupation for a child draft: adults work, school-age children study. */
function childOccupation(age: number): string | null {
  if (age >= 18) {
    return pick(SOUTH_INDIAN_OCCUPATIONS);
  }
  if (age >= 5) {
    return "Student";
  }
  return null;
}

/** Marital status for a single-adult household head (no spouse link stored). */
function singleMaritalStatus(
  soloElder: boolean,
  membership: MembershipStatus
): (typeof MARITAL_STATUS_VALUES)[number] {
  if (membership === MEMBERSHIP_STATUS.DECEASED) {
    return MARITAL_STATUS.WIDOWED;
  }
  if (soloElder) {
    return pick([
      MARITAL_STATUS.WIDOWED,
      MARITAL_STATUS.WIDOWED,
      MARITAL_STATUS.SINGLE,
      MARITAL_STATUS.DIVORCED,
    ] as const);
  }
  return faker.helpers.weightedArrayElement([
    { weight: 70, value: MARITAL_STATUS.SINGLE },
    { weight: 12, value: MARITAL_STATUS.DIVORCED },
    { weight: 8, value: MARITAL_STATUS.SEPARATED },
    { weight: 10, value: MARITAL_STATUS.MARRIED },
  ]);
}

/** Ages (eldest first) for 0-3 children, each ≥18 years younger than both parents. */
function rollChildAges(headAge: number, spouseAge: number): number[] {
  const maxChildAge = Math.min(24, Math.min(headAge, spouseAge) - 18);
  if (maxChildAge < 0) {
    return [];
  }
  const childCount = faker.helpers.weightedArrayElement([
    { weight: 25, value: 0 },
    { weight: 30, value: 1 },
    { weight: 30, value: 2 },
    { weight: 15, value: 3 },
  ]);
  return Array.from({ length: childCount }, () =>
    faker.number.int({ min: 0, max: maxChildAge })
  ).sort((a, b) => b - a); // eldest first
}

interface CoupleMembership {
  deceasedIsHead: boolean;
  head: MembershipStatus;
  spouse: MembershipStatus;
  widowed: boolean;
}

/**
 * Membership for a couple. Death may visit elderly couples: one partner is
 * Deceased (with a Memorial Day) and the survivor is Widowed.
 */
function rollCoupleMembership(
  headAge: number,
  spouseAge: number
): CoupleMembership {
  const widowed =
    Math.min(headAge, spouseAge) >= 60 && faker.number.float() < 0.12;
  const deceasedIsHead = faker.number.float() < 0.5;
  return {
    head:
      widowed && deceasedIsHead
        ? MEMBERSHIP_STATUS.DECEASED
        : adultMembershipStatus(headAge),
    spouse:
      widowed && !deceasedIsHead
        ? MEMBERSHIP_STATUS.DECEASED
        : adultMembershipStatus(spouseAge),
    widowed,
    deceasedIsHead,
  };
}

function memorialFor(membership: MembershipStatus): string | null {
  return membership === MEMBERSHIP_STATUS.DECEASED
    ? generateMemorialDay()
    : null;
}

function weddingAnniversary(weddingDate: string | null): ImportantDate[] {
  if (!weddingDate) {
    return [];
  }
  return [
    {
      id: faker.string.uuid(),
      name: "Wedding Anniversary",
      date: weddingDate,
      recurrence: IMPORTANT_DATE_RECURRENCE.YEARLY,
      category: IMPORTANT_DATE_CATEGORY.PERSONAL,
    },
  ];
}

/** A married (or widowed) couple household with 0-3 children. */
function planCoupleFamily(): FamilyPlan {
  const lastName = pick(SOUTH_INDIAN_LAST_NAMES);
  const headGender = faker.number.float() < 0.7 ? "male" : "female";
  const spouseGender = headGender === "male" ? "female" : "male";
  const headAge = faker.number.int({ min: 28, max: 55 });
  const spouseAge = Math.max(
    24,
    headAge + faker.number.int({ min: -6, max: 6 })
  );
  const headDob = dobForAge(headAge);
  const spouseDob = dobForAge(spouseAge);

  const headFirst = getSouthIndianFirstName(headGender);
  const spouseFirst = getSouthIndianFirstName(spouseGender);

  const childAges = rollChildAges(headAge, spouseAge);
  const eldestChildDob =
    childAges.length > 0 ? dobForAge(childAges[0] as number) : null;

  const membership = rollCoupleMembership(headAge, spouseAge);

  const weddingLatest =
    eldestChildDob == null
      ? REFERENCE_DATE
      : new Date(eldestChildDob.getTime() - 270 * DAY_MS);
  const weddingDate = generateWeddingDate(headDob, weddingLatest);
  const anniversary = weddingAnniversary(weddingDate);

  const head = basePersonDraft({
    firstName: headFirst,
    lastName,
    gender: headGender,
    dateOfBirth: headDob,
    maritalStatus:
      membership.widowed && !membership.deceasedIsHead
        ? MARITAL_STATUS.WIDOWED
        : MARITAL_STATUS.MARRIED,
    membershipStatus: membership.head,
    weddingDate,
    memorialDay: memorialFor(membership.head),
    importantDates: anniversary,
  });
  head.householdRole = HOUSEHOLD_ROLE.HEAD;

  const spouse = basePersonDraft({
    firstName: spouseFirst,
    lastName,
    gender: spouseGender,
    dateOfBirth: spouseDob,
    maritalStatus:
      membership.widowed && membership.deceasedIsHead
        ? MARITAL_STATUS.WIDOWED
        : MARITAL_STATUS.MARRIED,
    membershipStatus: membership.spouse,
    weddingDate,
    memorialDay: memorialFor(membership.spouse),
    importantDates: anniversary,
    // Some spouses keep their own mobile number as an override.
    phone: faker.number.float() < 0.25 ? generatePhone() : null,
  });
  spouse.householdRole = HOUSEHOLD_ROLE.SPOUSE;

  const fatherName =
    headGender === "male"
      ? `${headFirst} ${lastName}`
      : `${spouseFirst} ${lastName}`;
  const motherName =
    headGender === "female"
      ? `${headFirst} ${lastName}`
      : `${spouseFirst} ${lastName}`;

  const members: FamilyMember[] = [
    { draft: head, dob: headDob, role: "head" },
    { draft: spouse, dob: spouseDob, role: "spouse" },
  ];

  for (const age of childAges) {
    const gender = pick(GENDER_VALUES);
    const dob = dobForAge(age);
    const child = basePersonDraft({
      firstName: getSouthIndianFirstName(gender),
      lastName,
      gender,
      dateOfBirth: dob,
      maritalStatus: MARITAL_STATUS.SINGLE,
      membershipStatus: childMembershipStatus(),
      occupation: childOccupation(age),
      fathersName: fatherName,
      mothersName: motherName,
      email: age >= 16 ? undefined : null,
      phone: age >= 13 && faker.number.float() < 0.5 ? generatePhone() : null,
    });
    child.householdRole = HOUSEHOLD_ROLE.CHILD;
    members.push({ draft: child, dob, role: "child" });
  }

  return { household: planHousehold(lastName), members };
}

/** A single adult (or solo elder) heading their own household. */
function planSingleFamily(): FamilyPlan {
  const lastName = pick(SOUTH_INDIAN_LAST_NAMES);
  const soloElder = faker.number.float() < 0.15;
  const age = soloElder
    ? faker.number.int({ min: 68, max: 85 })
    : faker.number.int({ min: 22, max: 60 });
  const gender = pick(GENDER_VALUES);
  const membership = adultMembershipStatus(age);
  const maritalStatus = singleMaritalStatus(soloElder, membership);

  const headDob = dobForAge(age);
  const draft = basePersonDraft({
    firstName: getSouthIndianFirstName(gender),
    lastName,
    gender,
    dateOfBirth: headDob,
    maritalStatus,
    membershipStatus: membership,
    memorialDay:
      membership === MEMBERSHIP_STATUS.DECEASED ? generateMemorialDay() : null,
    weddingDate:
      maritalStatus === MARITAL_STATUS.MARRIED
        ? generateWeddingDate(headDob)
        : null,
  });
  draft.householdRole = HOUSEHOLD_ROLE.HEAD;
  return {
    household: planHousehold(lastName),
    members: [{ draft, dob: headDob, role: "head" }],
  };
}

/** A newcomer household: young visitor couple or individual, lightly filled in. */
function planVisitorFamily(): FamilyPlan {
  const lastName = pick(SOUTH_INDIAN_LAST_NAMES);
  const couple = faker.number.float() < 0.4;
  const members: FamilyMember[] = [];
  const ages = couple
    ? [
        faker.number.int({ min: 24, max: 40 }),
        faker.number.int({ min: 24, max: 40 }),
      ]
    : [faker.number.int({ min: 20, max: 55 })];

  ages.forEach((age, index) => {
    const gender = index === 0 ? pick(GENDER_VALUES) : "female";
    const dob = dobForAge(age);
    const draft = basePersonDraft({
      firstName: getSouthIndianFirstName(gender),
      lastName,
      gender,
      dateOfBirth: dob,
      maritalStatus: couple ? MARITAL_STATUS.MARRIED : MARITAL_STATUS.SINGLE,
      membershipStatus: MEMBERSHIP_STATUS.VISITOR,
      weddingDate: couple ? generateWeddingDate(dob) : null,
      occupation: pick(SOUTH_INDIAN_OCCUPATIONS),
    });
    draft.householdRole =
      index === 0 ? HOUSEHOLD_ROLE.HEAD : HOUSEHOLD_ROLE.SPOUSE;
    members.push({ draft, dob, role: index === 0 ? "head" : "spouse" });
  });

  return { household: planHousehold(lastName), members };
}

// ============================================================================
// SEED
// ============================================================================

type SeedDb = NodePgDatabase<typeof schema>;

interface StaticSeedData {
  allDepartments: (typeof departmentsTable.$inferSelect)[];
  allGroups: (typeof groupsTable.$inferSelect)[];
  allPositions: (typeof positionsTable.$inferSelect)[];
}

interface SeedAccumulator {
  departmentMemberships: (typeof peopleDepartmentsTable.$inferInsert)[];
  groupMemberships: (typeof peopleGroupsTable.$inferInsert)[];
  households: number;
  people: number;
  positionHistory: (typeof positionHistoryTable.$inferInsert)[];
  relationships: (typeof relationshipsTable.$inferInsert)[];
}

interface FamilyInsertResult {
  childIds: string[];
  headId?: string;
  insertedCount: number;
  memberIds: (string | null)[];
  spouseId?: string;
}

function newAccumulator(): SeedAccumulator {
  return {
    households: 0,
    people: 0,
    relationships: [],
    groupMemberships: [],
    departmentMemberships: [],
    positionHistory: [],
  };
}

/** Static ministry data (idempotent: names are unique). */
async function seedStaticTables(db: SeedDb): Promise<StaticSeedData> {
  await db.insert(groupsTable).values(SEED_GROUPS).onConflictDoNothing();
  await db
    .insert(departmentsTable)
    .values(SEED_DEPARTMENTS)
    .onConflictDoNothing();

  const allGroups = await db.select().from(groupsTable);
  const allDepartments = await db.select().from(departmentsTable);
  const departmentIdByName = new Map(allDepartments.map((d) => [d.name, d.id]));

  await db
    .insert(positionsTable)
    .values(
      SEED_POSITIONS.map((p) => ({
        name: p.name,
        description: null,
        departmentId: p.department
          ? (departmentIdByName.get(p.department) ?? null)
          : null,
      }))
    )
    .onConflictDoNothing();
  const allPositions = await db.select().from(positionsTable);

  return { allGroups, allDepartments, allPositions };
}

function rollFamilyPlan(): FamilyPlan {
  const roll = faker.number.float();
  if (roll < 0.55) {
    return planCoupleFamily();
  }
  if (roll < 0.8) {
    return planSingleFamily();
  }
  return planVisitorFamily();
}

function planFamilies(target: number): FamilyPlan[] {
  const plans: FamilyPlan[] = [];
  let planned = 0;
  while (planned < target) {
    const plan = rollFamilyPlan();
    plans.push(plan);
    planned += plan.members.length;
  }
  return plans;
}

/** Inserts one family's people; returns the surviving ids for link building. */
async function insertFamilyPeople(
  db: SeedDb,
  plan: FamilyPlan,
  householdId: string
): Promise<FamilyInsertResult> {
  const result: FamilyInsertResult = {
    childIds: [],
    memberIds: [],
    insertedCount: 0,
  };
  for (const member of plan.members) {
    // Faker can occasionally collide on the (first_name, last_name,
    // date_of_birth) unique index or the unique email — skip those rather
    // than aborting the whole seed.
    const [inserted] = await db
      .insert(peopleTable)
      .values({ ...member.draft, householdId })
      .onConflictDoNothing()
      .returning();
    result.memberIds.push(inserted?.id ?? null);
    if (inserted) {
      result.insertedCount += 1;
      if (member.role === "child") {
        result.childIds.push(inserted.id);
      } else if (member.role === "head") {
        result.headId = inserted.id;
      } else {
        result.spouseId = inserted.id;
      }
    }
  }
  return result;
}

function spouseLinkState(
  maritalStatus: (typeof MARITAL_STATUS_VALUES)[number] | undefined,
  headDeceased: boolean,
  spouseDeceased: boolean
): (typeof SPOUSE_STATE_VALUES)[number] {
  if (
    maritalStatus === MARITAL_STATUS.MARRIED ||
    headDeceased ||
    spouseDeceased
  ) {
    return SPOUSE_STATE.MARRIED;
  }
  if (maritalStatus === MARITAL_STATUS.SEPARATED) {
    return SPOUSE_STATE.SEPARATED;
  }
  return SPOUSE_STATE.DIVORCED;
}

function collectSpouseLink(
  plan: FamilyPlan,
  result: FamilyInsertResult,
  acc: SeedAccumulator
): void {
  const { headId, spouseId } = result;
  if (!(headId && spouseId)) {
    return;
  }
  // One row per pair — the reciprocal view is derived on read. A stored
  // "married" link with a deceased partner reads as widowed (widowhood is
  // derived, ADR-0003); divorced/separated are stored as-is.
  const headDraft = plan.members.find((m) => m.role === "head")?.draft;
  const spouseDraft = plan.members.find((m) => m.role === "spouse")?.draft;
  acc.relationships.push({
    personId: headId,
    relatedPersonId: spouseId,
    type: RELATIONSHIP_TYPE.SPOUSE,
    state: spouseLinkState(
      headDraft?.maritalStatus,
      headDraft?.membershipStatus === MEMBERSHIP_STATUS.DECEASED,
      spouseDraft?.membershipStatus === MEMBERSHIP_STATUS.DECEASED
    ),
  });
}

function collectParentLinks(
  result: FamilyInsertResult,
  acc: SeedAccumulator
): void {
  const parentIds = [result.headId, result.spouseId].filter(
    (id): id is string => typeof id === "string"
  );
  for (const childId of result.childIds) {
    for (const parentId of parentIds) {
      acc.relationships.push({
        personId: childId,
        relatedPersonId: parentId,
        type: RELATIONSHIP_TYPE.PARENT,
        state: null,
      });
    }
  }
}

function collectSiblingLinks(
  result: FamilyInsertResult,
  acc: SeedAccumulator
): void {
  const { childIds } = result;
  for (let i = 0; i + 1 < childIds.length; i += 1) {
    const younger = childIds[i + 1];
    const elder = childIds[i];
    if (younger && elder) {
      acc.relationships.push({
        personId: younger,
        relatedPersonId: elder,
        type: RELATIONSHIP_TYPE.SIBLING,
        state: null,
      });
    }
  }
}

function randomJoinedAt(): string {
  return formatDate(
    faker.date.between({
      from: new Date(REFERENCE_DATE.getTime() - 5 * 365 * DAY_MS),
      to: REFERENCE_DATE,
    })
  );
}

function collectGroupMemberships(
  personId: string,
  statics: StaticSeedData,
  acc: SeedAccumulator
): void {
  const groupCount = faker.helpers.weightedArrayElement([
    { weight: 25, value: 0 },
    { weight: 40, value: 1 },
    { weight: 25, value: 2 },
    { weight: 10, value: 3 },
  ]);
  for (const group of faker.helpers.arrayElements(
    statics.allGroups,
    groupCount
  )) {
    acc.groupMemberships.push({
      personId,
      groupId: group.id,
      joinedAt: randomJoinedAt(),
      isActive: true,
    });
  }
}

function collectDepartmentMemberships(
  personId: string,
  statics: StaticSeedData,
  acc: SeedAccumulator
): void {
  const deptCount = faker.helpers.weightedArrayElement([
    { weight: 30, value: 0 },
    { weight: 45, value: 1 },
    { weight: 25, value: 2 },
  ]);
  for (const dept of faker.helpers.arrayElements(
    statics.allDepartments,
    deptCount
  )) {
    acc.departmentMemberships.push({
      personId,
      departmentId: dept.id,
      joinedAt: randomJoinedAt(),
      isActive: true,
    });
  }
}

/**
 * Church offices: some adult members hold a current position term, and a few
 * carry a past term too (position history, not a "current position").
 */
function collectPositionHistory(
  member: FamilyMember,
  personId: string,
  statics: StaticSeedData,
  acc: SeedAccumulator
): void {
  if (
    member.role === "child" ||
    member.draft.membershipStatus !== MEMBERSHIP_STATUS.MEMBER ||
    faker.number.float() >= 0.25 ||
    statics.allPositions.length === 0
  ) {
    return;
  }
  const termStart = faker.date.between({
    from: new Date(REFERENCE_DATE.getTime() - 2 * 365 * DAY_MS),
    to: new Date(REFERENCE_DATE.getTime() - 30 * DAY_MS),
  });
  acc.positionHistory.push({
    personId,
    positionId: pick(statics.allPositions).id,
    termStart: formatDate(termStart),
    termEnd: null,
  });
  if (faker.number.float() < 0.3) {
    acc.positionHistory.push({
      personId,
      positionId: pick(statics.allPositions).id,
      termStart: formatDate(new Date(termStart.getTime() - 3 * 365 * DAY_MS)),
      termEnd: formatDate(new Date(termStart.getTime() - 30 * DAY_MS)),
    });
  }
}

function collectFamilyMemberships(
  plan: FamilyPlan,
  result: FamilyInsertResult,
  statics: StaticSeedData,
  acc: SeedAccumulator
): void {
  // Teens and adults only.
  for (let i = 0; i < plan.members.length; i += 1) {
    const member = plan.members[i] as FamilyMember;
    const personId = result.memberIds[i];
    if (!personId || ageOn(member.dob) < 13) {
      continue;
    }
    collectGroupMemberships(personId, statics, acc);
    collectDepartmentMemberships(personId, statics, acc);
    collectPositionHistory(member, personId, statics, acc);
  }
}

async function insertAccumulated(
  db: SeedDb,
  acc: SeedAccumulator
): Promise<void> {
  if (acc.relationships.length > 0) {
    await db
      .insert(relationshipsTable)
      .values(acc.relationships)
      .onConflictDoNothing();
  }
  if (acc.groupMemberships.length > 0) {
    await db.insert(peopleGroupsTable).values(acc.groupMemberships);
  }
  if (acc.departmentMemberships.length > 0) {
    await db.insert(peopleDepartmentsTable).values(acc.departmentMemberships);
  }
  if (acc.positionHistory.length > 0) {
    await db.insert(positionHistoryTable).values(acc.positionHistory);
  }
}

/**
 * Guard: this seed is additive. It mints fresh Households with random ids, so
 * running it into a database that already holds seeded People would pile up
 * duplicate families — People dedupe on identity, but Households have no
 * natural key to conflict on. Refuse a non-empty database unless
 * SEED_RESET=true, which clears the seed-managed rows first.
 */
async function assertSeedable(db: SeedDb): Promise<void> {
  const [row] = await db.select({ value: count() }).from(peopleTable);
  const peopleCount = row?.value ?? 0;
  if (peopleCount === 0) {
    return;
  }

  if (process.env.SEED_RESET !== "true") {
    console.error(
      `Refusing to seed: the database already holds ${peopleCount} People. ` +
        "This seed is additive and would create duplicate Households. Seed a " +
        "fresh database, or set SEED_RESET=true to delete existing " +
        "People/Households (and their links) first."
    );
    process.exit(1);
  }

  console.log(
    `SEED_RESET=true — clearing ${peopleCount} existing People and their Households...`
  );
  // FK-safe order: link/history rows before the People they reference, then the
  // Households. (People → Households is ON DELETE SET NULL, so People go first.)
  await db.delete(positionHistoryTable);
  await db.delete(peopleDepartmentsTable);
  await db.delete(peopleGroupsTable);
  await db.delete(relationshipsTable);
  await db.delete(peopleTable);
  await db.delete(householdsTable);
}

async function seed() {
  // Load env + open the connection lazily so importing this module (e.g. to unit
  // test helpers) never requires a database.
  dotenv.config({ path: "../../apps/server/.env" });

  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error("Error: DATABASE_URL environment variable is not set");
    process.exit(1);
  }

  // Guard: never seed faker data into a non-local DB by accident. The active
  // DATABASE_URL can resolve to a cloud/production host (e.g. Neon), so refuse
  // anything that isn't localhost unless explicitly opted in.
  const host = new URL(dbUrl).hostname;
  const isLocalHost =
    host === "localhost" || host === "127.0.0.1" || host === "::1";
  if (!isLocalHost && process.env.SEED_ALLOW_REMOTE !== "true") {
    console.error(
      `Refusing to seed non-local database host "${host}". Seeding is for local development; set SEED_ALLOW_REMOTE=true to override.`
    );
    process.exit(1);
  }

  const db = drizzle(dbUrl, { schema });

  await assertSeedable(db);

  const target = Number.parseInt(process.argv[2] || "100", 10);
  console.log(`Seeding ~${target} people across family households...`);

  const statics = await seedStaticTables(db);

  const plans = planFamilies(target);
  const acc = newAccumulator();

  // Insert households + people per family (to link ids), accumulating the
  // relationship / membership / history rows for batched inserts below.
  for (const plan of plans) {
    const [household] = await db
      .insert(householdsTable)
      .values(plan.household)
      .returning();
    if (!household) {
      throw new Error("Failed to insert household");
    }
    acc.households += 1;

    const result = await insertFamilyPeople(db, plan, household.id);
    acc.people += result.insertedCount;

    collectSpouseLink(plan, result, acc);
    collectParentLinks(result, acc);
    collectSiblingLinks(result, acc);
    collectFamilyMemberships(plan, result, statics, acc);
  }

  await insertAccumulated(db, acc);

  console.log(`Households created:        ${acc.households}`);
  console.log(`People inserted:           ${acc.people}`);
  console.log(`Relationships linked:      ${acc.relationships.length}`);
  console.log(`Group memberships:         ${acc.groupMemberships.length}`);
  console.log(`Department memberships:    ${acc.departmentMemberships.length}`);
  console.log(`Position history rows:     ${acc.positionHistory.length}`);

  process.exit(0);
}

// tsx (unlike Bun) leaves `import.meta.main` undefined, so a main-module guard
// would silently skip the seed — this module is only ever run as the `db:seed`
// script and imported by nothing, so invoke directly.
seed().catch((error: unknown) => {
  console.error("Error seeding database:", error);
  process.exit(1);
});
