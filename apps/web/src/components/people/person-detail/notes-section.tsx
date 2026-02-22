import { StickyNote } from "lucide-react";
import type { PersonDetail } from "@/types/api";
import { SectionCard } from "./section-card";

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

interface NotesSectionProps {
  person: PersonDetail;
}

export function NotesSection({ person }: NotesSectionProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
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
