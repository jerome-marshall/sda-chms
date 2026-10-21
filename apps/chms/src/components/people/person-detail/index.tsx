import { Separator } from "@/components/ui/separator";
import type { People, PersonDetail, Relationships } from "@/types/api";

import { ChurchSection } from "./church-section";
import { NotesSection } from "./notes-section";
import { OverviewSection } from "./overview-section";
import { ProfileHeader } from "./profile-header";

interface PersonDetailProps {
  person: PersonDetail;
  relationships: Relationships;
  people: People;
}

export default function PersonDetailPage({
  person,
  relationships,
  people,
}: PersonDetailProps) {
  return (
    <div className="mx-auto w-full max-w-4xl">
      <ProfileHeader person={person} />

      <OverviewSection
        person={person}
        relationships={relationships}
        people={people}
      />

      <Separator className="my-8" />

      <ChurchSection person={person} />

      <Separator className="my-8" />

      <NotesSection person={person} />
    </div>
  );
}
