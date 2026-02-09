import { Briefcase, MapPin, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "../../ui/avatar";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import { ContactChips } from "./contact-chips";
import type { PersonData } from "./types";
import {
  buildAddress,
  formatLabel,
  getInitials,
  getMembershipColor,
} from "./utils";

interface ProfileHeaderProps {
  person: PersonData;
}

export function ProfileHeader({ person }: ProfileHeaderProps) {
  const address = buildAddress(person);

  return (
    <div className="flex flex-col gap-6 py-8 sm:flex-row sm:items-start">
      <Avatar className="size-20 text-2xl ring-2 ring-primary/20">
        {person.photoUrl ? (
          <AvatarImage alt={person.fullName} src={person.photoUrl} />
        ) : null}
        <AvatarFallback className="bg-primary/10 font-semibold text-primary text-xl">
          {getInitials(person.firstName, person.lastName)}
        </AvatarFallback>
      </Avatar>

      <div className="flex flex-1 flex-col gap-2">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-semibold text-2xl tracking-tight">
            {person.fullName}
          </h1>
          <Badge
            className={cn(
              "border font-medium text-[11px]",
              getMembershipColor(person.membershipStatus)
            )}
          >
            {formatLabel(person.membershipStatus)}
          </Badge>
          {!person.isActive && (
            <Badge className="border border-rose-500/25 bg-rose-500/15 font-medium text-[11px] text-rose-400">
              Inactive
            </Badge>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-muted-foreground text-sm">
          {person.gender && <span className="capitalize">{person.gender}</span>}
          {person.age != null && <span>Age {person.age}</span>}
          {person.occupation && (
            <span className="flex items-center gap-1.5">
              <Briefcase className="size-3.5" />
              {person.occupation}
            </span>
          )}
        </div>

        <ContactChips email={person.email} phone={person.phone}>
          {address && (
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-muted/60 px-2.5 py-1 text-sm">
              <MapPin className="size-3.5 text-muted-foreground" />
              {person.city}
              {person.state ? `, ${person.state}` : ""}
            </span>
          )}
        </ContactChips>
      </div>

      <Button size="sm" variant="outline">
        <Pencil className="size-3.5" data-icon="inline-start" />
        Edit
      </Button>
    </div>
  );
}
