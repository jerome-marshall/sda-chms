import { StickyNote } from "lucide-react";
import { SectionCard } from "./section-card";
import type { PersonData } from "./types";

interface NoteCardProps {
  title: string;
  description: string;
  content: string | null;
}

function NoteCard({ title, description, content }: NoteCardProps) {
  return (
    <SectionCard description={description} title={title}>
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted/60">
          <StickyNote className="size-4 text-muted-foreground" />
        </div>
        <p className="whitespace-pre-wrap text-foreground text-sm leading-relaxed">
          {content || `No ${title.toLowerCase()} recorded.`}
        </p>
      </div>
    </SectionCard>
  );
}

interface NotesTabProps {
  person: PersonData;
}

export function NotesTab({ person }: NotesTabProps) {
  return (
    <div className="mt-4 grid gap-4 md:grid-cols-2">
      <NoteCard
        content={person.visitationNotes}
        description="Visitation-related observations"
        title="Visitation Notes"
      />
      <NoteCard
        content={person.pastoralNotes}
        description="Pastoral observations and follow-ups"
        title="Pastoral Notes"
      />
    </div>
  );
}
