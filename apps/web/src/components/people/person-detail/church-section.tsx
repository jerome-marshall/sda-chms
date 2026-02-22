import { Calendar, Church, Droplets, MapPin, User } from "lucide-react";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { PersonDetail } from "@/types/api";
import { Badge } from "../../ui/badge";
import { DetailRow, SectionCard } from "./section-card";
import { formatLabel, getMembershipColor } from "./utils";

interface ChurchSectionProps {
  person: PersonDetail;
}

export function ChurchSection({ person }: ChurchSectionProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <SectionCard
        description="Their journey and involvement"
        title="Church Membership"
      >
        <DetailRow
          icon={Church}
          label="Member Status"
          value={
            <Badge
              className={cn(
                "border font-medium text-[11px]",
                getMembershipColor(person.membershipStatus)
              )}
            >
              {formatLabel(person.membershipStatus)}
            </Badge>
          }
        />
        <DetailRow
          icon={Calendar}
          label="Date Joined"
          value={
            person.dateJoinedChurch ? formatDate(person.dateJoinedChurch) : "—"
          }
        />
        <DetailRow
          icon={User}
          label="Sabbath School Class"
          value={formatLabel(person.sabbathSchoolClass)}
        />
      </SectionCard>

      <SectionCard description="Baptism record" title="Baptism">
        <DetailRow
          icon={Droplets}
          label="Baptism Date"
          value={person.baptismDate ? formatDate(person.baptismDate) : "—"}
        />
        <DetailRow
          icon={MapPin}
          label="Baptism Place"
          value={person.baptismPlace || "—"}
        />
      </SectionCard>
    </div>
  );
}
