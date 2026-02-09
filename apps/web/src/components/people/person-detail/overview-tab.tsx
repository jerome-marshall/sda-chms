import {
  Briefcase,
  Calendar,
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
import { Separator } from "../../ui/separator";
import { DetailRow, SectionCard } from "./section-card";
import type { PersonData } from "./types";
import { buildAddress, formatLabel } from "./utils";

interface OverviewTabProps {
  person: PersonData;
}

export function OverviewTab({ person }: OverviewTabProps) {
  const address = buildAddress(person);

  return (
    <div className="mt-4 grid gap-4 md:grid-cols-2">
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
              : "—"
          }
        />
        <DetailRow
          icon={Briefcase}
          label="Occupation"
          value={person.occupation}
        />
      </SectionCard>

      <SectionCard
        description="Best ways to reach them"
        title="Contact & Address"
      >
        <DetailRow icon={Phone} label="Phone" value={person.phone} />
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
            ) : (
              "—"
            )
          }
        />
        <Separator />
        <DetailRow icon={MapPin} label="Address" value={address || "—"} />
        {person.preferredVisitingTime && (
          <DetailRow
            icon={Calendar}
            label="Preferred Visiting Time"
            value={person.preferredVisitingTime}
          />
        )}
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
        {person.memorialDay && (
          <DetailRow
            icon={Calendar}
            label="Memorial Day"
            value={formatDate(person.memorialDay)}
          />
        )}
      </SectionCard>
    </div>
  );
}
