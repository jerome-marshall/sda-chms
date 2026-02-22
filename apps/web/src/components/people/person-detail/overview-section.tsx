import {
  Briefcase,
  Calendar,
  CalendarHeartIcon,
  Heart,
  Home,
  Mail,
  MapPin,
  MarsIcon,
  Phone,
  User,
  UtensilsCrossed,
  VenusIcon,
} from "lucide-react";
import { formatDate } from "@/lib/format";
import type { PersonDetail } from "@/types/api";
import { getInfoOrFromHousehold } from "@/utils/people";
import { Separator } from "../../ui/separator";
import { DetailRow, SectionCard } from "./section-card";
import { formatLabel, getAddress } from "./utils";

interface OverviewSectionProps {
  person: PersonDetail;
}

export function OverviewSection({ person }: OverviewSectionProps) {
  // Resolve contact fields with head-of-household fallback so the UI can
  // show the head's info (with a tooltip) when the member has none.
  const { address, isAddressFromHousehold } = getAddress(person);
  const { data: phone, isfromHousehold: isPhoneFromHousehold } =
    getInfoOrFromHousehold(person, "phone");
  const {
    data: preferredVisitingTime,
    isfromHousehold: isPreferredVisitingTimeFromHousehold,
  } = getInfoOrFromHousehold(person, "preferredVisitingTime");

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <SectionCard
        description="Who they are at a glance"
        title="Personal Information"
      >
        <DetailRow icon={User} label="Full Name" value={person.fullName} />
        {person.preferredName && (
          <DetailRow
            icon={User}
            label="Preferred Name"
            value={person.preferredName}
          />
        )}
        <DetailRow
          icon={person.gender === "male" ? MarsIcon : VenusIcon}
          label="Gender"
          value={formatLabel(person.gender)}
        />
        <DetailRow
          icon={Calendar}
          label="Date of Birth"
          value={
            person.dateOfBirth
              ? `${formatDate(person.dateOfBirth)} (Age ${person.age})`
              : null
          }
        />
        <DetailRow
          icon={Briefcase}
          label="Occupation"
          value={person.occupation}
        />
        {person.memorialDay && (
          <DetailRow
            icon={Calendar}
            label="Memorial Day"
            value={formatDate(person.memorialDay)}
          />
        )}
      </SectionCard>

      <SectionCard
        description="Best ways to reach them"
        title="Contact & Address"
      >
        <DetailRow
          icon={Phone}
          isFromHousehold={isPhoneFromHousehold}
          label="Phone"
          value={phone}
        />
        <DetailRow
          icon={Mail}
          label="Email"
          value={
            person.email ? (
              <a
                className="text-primary hover:underline"
                href={`mailto:${person.email}`}
              >
                {person.email}
              </a>
            ) : null
          }
        />
        <Separator />
        <DetailRow
          icon={MapPin}
          isFromHousehold={isAddressFromHousehold}
          label="Address"
          value={address}
        />
      </SectionCard>

      <SectionCard
        description="Family and household details"
        title="Marital & Family"
      >
        <DetailRow
          icon={Heart}
          label="Marital Status"
          value={formatLabel(person.maritalStatus)}
        />
        {person.weddingDate && (
          <DetailRow
            icon={Calendar}
            label="Wedding Date"
            value={formatDate(person.weddingDate)}
          />
        )}
        <Separator />
        <DetailRow
          icon={Home}
          label="Household Role"
          value={formatLabel(person.householdRole)}
        />
      </SectionCard>

      <SectionCard
        description="For meal planning at events"
        title="Preferences"
      >
        <DetailRow
          icon={UtensilsCrossed}
          label="Dietary Preference"
          value={formatLabel(person.dietaryPreference)}
        />
        <DetailRow
          icon={Calendar}
          isFromHousehold={isPreferredVisitingTimeFromHousehold}
          label="Visiting Time"
          value={preferredVisitingTime}
        />
      </SectionCard>

      {person.importantDates && person.importantDates.length > 0 && (
        <SectionCard
          description="Special occasions and anniversaries"
          title="Dates to Remember"
        >
          {person.importantDates.map((entry) => (
            <DetailRow
              icon={CalendarHeartIcon}
              key={`${entry.name}-${entry.date}`}
              label={entry.name}
              value={formatDate(entry.date)}
            />
          ))}
        </SectionCard>
      )}
    </div>
  );
}
