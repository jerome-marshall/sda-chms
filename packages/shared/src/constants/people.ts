export const GENDER = {
  MALE: "male",
  FEMALE: "female",
  OTHER: "other",
} as const;
export const GENDER_VALUES = [
  GENDER.MALE,
  GENDER.FEMALE,
  GENDER.OTHER,
] as const;
export const GENDER_OPTIONS = [
  { value: GENDER.MALE, label: "Male" },
  { value: GENDER.FEMALE, label: "Female" },
  { value: GENDER.OTHER, label: "Other" },
];

export const MARITAL_STATUS = {
  SINGLE: "single",
  MARRIED: "married",
  DIVORCED: "divorced",
  WIDOWED: "widowed",
  SEPARATED: "separated",
} as const;
export const MARITAL_STATUS_VALUES = [
  MARITAL_STATUS.SINGLE,
  MARITAL_STATUS.MARRIED,
  MARITAL_STATUS.DIVORCED,
  MARITAL_STATUS.WIDOWED,
  MARITAL_STATUS.SEPARATED,
] as const;
export const MARITAL_STATUS_OPTIONS = [
  { value: MARITAL_STATUS.SINGLE, label: "Single" },
  { value: MARITAL_STATUS.MARRIED, label: "Married" },
  { value: MARITAL_STATUS.DIVORCED, label: "Divorced" },
  { value: MARITAL_STATUS.WIDOWED, label: "Widowed" },
  { value: MARITAL_STATUS.SEPARATED, label: "Separated" },
];

export const MEMBERSHIP_STATUS = {
  MEMBER: "member",
  REGULAR_ATTENDEE: "regular_attendee",
  VISITOR: "visitor",
  INACTIVE: "inactive",
  MOVED: "moved",
  DECEASED: "deceased",
} as const;
export const MEMBERSHIP_STATUS_VALUES = [
  MEMBERSHIP_STATUS.MEMBER,
  MEMBERSHIP_STATUS.REGULAR_ATTENDEE,
  MEMBERSHIP_STATUS.VISITOR,
  MEMBERSHIP_STATUS.INACTIVE,
  MEMBERSHIP_STATUS.MOVED,
  MEMBERSHIP_STATUS.DECEASED,
] as const;
export const MEMBERSHIP_STATUS_OPTIONS = [
  { value: MEMBERSHIP_STATUS.MEMBER, label: "Member" },
  { value: MEMBERSHIP_STATUS.REGULAR_ATTENDEE, label: "Regular Attendee" },
  { value: MEMBERSHIP_STATUS.VISITOR, label: "Visitor" },
  { value: MEMBERSHIP_STATUS.INACTIVE, label: "Inactive" },
  { value: MEMBERSHIP_STATUS.MOVED, label: "Moved" },
  { value: MEMBERSHIP_STATUS.DECEASED, label: "Deceased" },
];

export const HOUSEHOLD_ROLE = {
  HEAD: "head",
  SPOUSE: "spouse",
  CHILD: "child",
  OTHER: "other",
} as const;
export const HOUSEHOLD_ROLE_VALUES = [
  HOUSEHOLD_ROLE.HEAD,
  HOUSEHOLD_ROLE.SPOUSE,
  HOUSEHOLD_ROLE.CHILD,
  HOUSEHOLD_ROLE.OTHER,
] as const;
export const HOUSEHOLD_ROLE_OPTIONS = [
  { value: HOUSEHOLD_ROLE.HEAD, label: "Head" },
  { value: HOUSEHOLD_ROLE.SPOUSE, label: "Spouse" },
  { value: HOUSEHOLD_ROLE.CHILD, label: "Child" },
  { value: HOUSEHOLD_ROLE.OTHER, label: "Other" },
];

export const RELATIONSHIP_TYPE = {
  PARENT: "parent",
  CHILD: "child",
  SPOUSE: "spouse",
  SIBLING: "sibling",
  GRANDPARENT: "grandparent",
  GRANDCHILD: "grandchild",
  OTHER: "other",
} as const;
export const RELATIONSHIP_TYPE_VALUES = [
  RELATIONSHIP_TYPE.PARENT,
  RELATIONSHIP_TYPE.CHILD,
  RELATIONSHIP_TYPE.SPOUSE,
  RELATIONSHIP_TYPE.SIBLING,
  RELATIONSHIP_TYPE.GRANDPARENT,
  RELATIONSHIP_TYPE.GRANDCHILD,
  RELATIONSHIP_TYPE.OTHER,
] as const;

export const DIETARY_PREFERENCES = {
  VEGAN: "vegan",
  VEGETARIAN: "vegetarian",
  GLUTEN_FREE: "gluten_free",
  LACTOSE_FREE: "lactose_free",
  NUT_FREE: "nut_free",
  OTHER: "other",
  NONE: "none",
} as const;
export const DIETARY_PREFERENCES_VALUES = [
  DIETARY_PREFERENCES.VEGAN,
  DIETARY_PREFERENCES.VEGETARIAN,
  DIETARY_PREFERENCES.GLUTEN_FREE,
  DIETARY_PREFERENCES.LACTOSE_FREE,
  DIETARY_PREFERENCES.NUT_FREE,
  DIETARY_PREFERENCES.OTHER,
  DIETARY_PREFERENCES.NONE,
] as const;
export const DIETARY_PREFERENCES_OPTIONS = [
  { value: DIETARY_PREFERENCES.VEGAN, label: "Vegan" },
  { value: DIETARY_PREFERENCES.VEGETARIAN, label: "Vegetarian" },
  { value: DIETARY_PREFERENCES.GLUTEN_FREE, label: "Gluten Free" },
  { value: DIETARY_PREFERENCES.LACTOSE_FREE, label: "Lactose Free" },
  { value: DIETARY_PREFERENCES.NUT_FREE, label: "Nut Free" },
  { value: DIETARY_PREFERENCES.OTHER, label: "Other" },
  { value: DIETARY_PREFERENCES.NONE, label: "None" },
];

/** SDA Sabbath School divisions, each mapped to an age range per General Conference guidelines. */
export const SABBATH_SCHOOL_CLASS = {
  BEGINNER: "beginner",
  KINDERGARTEN: "kindergarten",
  PRIMARY: "primary",
  JUNIOR: "junior",
  EARLITEEN: "earliteen",
  YOUTH: "youth",
  YOUNG_ADULT: "young_adult",
  ADULT: "adult",
} as const;
export const SABBATH_SCHOOL_CLASS_VALUES = [
  SABBATH_SCHOOL_CLASS.BEGINNER,
  SABBATH_SCHOOL_CLASS.KINDERGARTEN,
  SABBATH_SCHOOL_CLASS.PRIMARY,
  SABBATH_SCHOOL_CLASS.JUNIOR,
  SABBATH_SCHOOL_CLASS.EARLITEEN,
  SABBATH_SCHOOL_CLASS.YOUTH,
  SABBATH_SCHOOL_CLASS.YOUNG_ADULT,
  SABBATH_SCHOOL_CLASS.ADULT,
] as const;
/** Options include `minAge`/`maxAge` for auto-assigning a person's Sabbath School class by age. */
export const SABBATH_SCHOOL_CLASS_OPTIONS = [
  {
    value: SABBATH_SCHOOL_CLASS.BEGINNER,
    label: "Beginner",
    ageGroup: "Birth-2",
    minAge: 0,
    maxAge: 2,
  },
  {
    value: SABBATH_SCHOOL_CLASS.KINDERGARTEN,
    label: "Kindergarten",
    ageGroup: "3-5",
    minAge: 3,
    maxAge: 5,
  },
  {
    value: SABBATH_SCHOOL_CLASS.PRIMARY,
    label: "Primary",
    ageGroup: "6-9",
    minAge: 6,
    maxAge: 9,
  },
  {
    value: SABBATH_SCHOOL_CLASS.JUNIOR,
    label: "Junior",
    ageGroup: "10-12",
    minAge: 10,
    maxAge: 12,
  },
  {
    value: SABBATH_SCHOOL_CLASS.EARLITEEN,
    label: "Earliteen",
    ageGroup: "13-14",
    minAge: 13,
    maxAge: 14,
  },
  {
    value: SABBATH_SCHOOL_CLASS.YOUTH,
    label: "Youth",
    ageGroup: "15-18",
    minAge: 15,
    maxAge: 18,
  },
  {
    value: SABBATH_SCHOOL_CLASS.YOUNG_ADULT,
    label: "Young Adult",
    ageGroup: "19-30",
    minAge: 19,
    maxAge: 30,
  },
  {
    value: SABBATH_SCHOOL_CLASS.ADULT,
    label: "Adult",
    ageGroup: "30+",
    minAge: 18,
    maxAge: Number.POSITIVE_INFINITY,
  },
];
