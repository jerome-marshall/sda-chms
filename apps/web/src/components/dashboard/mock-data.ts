// Celebration entry (birthday or anniversary)
export interface Celebration {
  id: string;
  name: string;
  date: string; // ISO date or "Feb 14" format
  type: "birthday" | "anniversary";
  age?: number; // for birthdays
  years?: number; // for anniversaries
}

// Memorial entry
export interface MemorialEntry {
  id: string;
  memberName: string;
  lovedOneName: string;
  date: string;
  yearsSince: number;
}

// Membership stats
export interface MembershipStats {
  totalMembers: number;
  totalFamilies: number;
  totalBaptized: number;
  totalUnbaptizedChildren: number;
  activeCount: number;
  inactiveCount: number;
  newThisQuarter: number;
  byAgeGroup: { group: string; count: number }[];
  byStatus: { status: string; count: number }[];
}

export const MOCK_CELEBRATIONS: Celebration[] = [
  { id: "1", name: "Sarah Jenkins", date: "Feb 12", type: "birthday", age: 34 },
  {
    id: "2",
    name: "Marcus & Elena Rodriguez",
    date: "Feb 14",
    type: "anniversary",
    years: 12,
  },
  { id: "3", name: "David Chen", date: "Feb 18", type: "birthday", age: 8 },
  {
    id: "4",
    name: "James & Mary Smith",
    date: "Feb 22",
    type: "anniversary",
    years: 25,
  },
  { id: "5", name: "Olivia Taylor", date: "Feb 28", type: "birthday", age: 41 },
];

export const MOCK_MEMORIALS: MemorialEntry[] = [
  {
    id: "1",
    memberName: "Robert Davis",
    lovedOneName: "Eleanor Davis (Wife)",
    date: "Feb 15",
    yearsSince: 4,
  },
  {
    id: "2",
    memberName: "Sarah Jenkins",
    lovedOneName: "Michael Jenkins (Father)",
    date: "Feb 20",
    yearsSince: 10,
  },
  {
    id: "3",
    memberName: "The Wilson Family",
    lovedOneName: "Grandma Rose",
    date: "Feb 25",
    yearsSince: 1,
  },
];

export const MOCK_MEMBERSHIP_STATS: MembershipStats = {
  totalMembers: 482,
  totalFamilies: 156,
  totalBaptized: 345,
  totalUnbaptizedChildren: 82,
  activeCount: 390,
  inactiveCount: 92,
  newThisQuarter: 14,
  byAgeGroup: [
    { group: "Beginner", count: 24 },
    { group: "Kindergarten", count: 28 },
    { group: "Primary", count: 35 },
    { group: "Junior", count: 31 },
    { group: "Earliteen", count: 18 },
    { group: "Youth", count: 42 },
    { group: "Young Adult", count: 85 },
    { group: "Adult", count: 219 },
  ],
  byStatus: [
    { status: "Member", count: 320 },
    { status: "Regular Attendee", count: 110 },
    { status: "Visitor", count: 52 },
  ],
};
