import { Separator } from "@/components/ui/separator";
import { ChurchSection } from "./church-section";
import { NotesSection } from "./notes-section";
import { OverviewSection } from "./overview-section";
import { ProfileHeader } from "./profile-header";
import type { PersonData } from "./types";

interface PersonDetailProps {
  person: PersonData;
}

export default function PersonDetail({ person }: PersonDetailProps) {
  return (
    <div className="mx-auto w-full max-w-4xl">
      <ProfileHeader person={person} />

      <OverviewSection person={person} />

      <Separator className="my-8" />

      <ChurchSection person={person} />

      <Separator className="my-8" />

      <NotesSection person={person} />
    </div>
  );
}

export type { PersonData } from "./types";
