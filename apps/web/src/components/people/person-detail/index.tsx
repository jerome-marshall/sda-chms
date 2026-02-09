import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../ui/tabs";
import { ChurchTab } from "./church-tab";
import { NotesTab } from "./notes-tab";
import { OverviewTab } from "./overview-tab";
import { ProfileHeader } from "./profile-header";
import type { PersonData } from "./types";

interface PersonDetailProps {
  person: PersonData;
}

export default function PersonDetail({ person }: PersonDetailProps) {
  return (
    <div className="mx-auto w-full max-w-4xl">
      <ProfileHeader person={person} />

      <Tabs defaultValue="overview">
        <TabsList variant="line">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="church">Church</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab person={person} />
        </TabsContent>

        <TabsContent value="church">
          <ChurchTab person={person} />
        </TabsContent>

        <TabsContent value="notes">
          <NotesTab person={person} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export type { PersonData } from "./types";
