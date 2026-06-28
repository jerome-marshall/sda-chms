import {
  RELATIONSHIP_TYPE_OPTIONS,
  type RELATIONSHIP_TYPE_VALUES,
} from "@sda-chms/shared/constants/people";
import { Trash2, Users } from "lucide-react";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePeople } from "@/hooks/data/use-people";
import {
  useAddRelationship,
  useRelationships,
  useRemoveRelationship,
} from "@/hooks/data/use-relationships";
import type { PersonDetail } from "@/types/api";
import { SectionCard } from "./section-card";
import { formatLabel, getInitials } from "./utils";

type RelationshipType = (typeof RELATIONSHIP_TYPE_VALUES)[number];

interface RelationshipsSectionProps {
  person: PersonDetail;
}

/** Lists a Person's relationships and lets the user add or remove them (ADR-0003). */
export function RelationshipsSection({ person }: RelationshipsSectionProps) {
  const { data: relationships } = useRelationships(person.id);
  const { data: people } = usePeople();

  const [relatedPersonId, setRelatedPersonId] = useState("");
  const [type, setType] = useState<RelationshipType | "">("");

  const addRelationship = useAddRelationship({
    onSuccess: () => {
      setRelatedPersonId("");
      setType("");
    },
  });
  const removeRelationship = useRemoveRelationship();

  // Anyone but this person is a valid link target.
  const candidates = (people ?? []).filter((p) => p.id !== person.id);

  const canSubmit = relatedPersonId && type && !addRelationship.isPending;

  const handleAdd = () => {
    if (!(relatedPersonId && type)) {
      return;
    }
    addRelationship.mutate({
      personId: person.id,
      relatedPersonId,
      type,
    });
  };

  return (
    <SectionCard
      description="Family links to other people, independent of household"
      title="Relationships"
    >
      {relationships && relationships.length > 0 ? (
        <ul className="grid gap-2">
          {relationships.map((relationship) => (
            <li
              className="flex items-center gap-3 rounded-lg border p-2"
              key={relationship.id}
            >
              <Avatar className="size-9">
                <AvatarImage
                  src={relationship.relatedPerson.photoUrl ?? undefined}
                />
                <AvatarFallback>
                  {getInitials(
                    relationship.relatedPerson.firstName,
                    relationship.relatedPerson.lastName
                  )}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-sm">
                  {relationship.relatedPerson.fullName}
                </p>
                <p className="text-muted-foreground text-xs">
                  {formatLabel(relationship.type)}
                </p>
              </div>
              <Button
                aria-label={`Remove ${relationship.relatedPerson.fullName}`}
                disabled={removeRelationship.isPending}
                onClick={() => removeRelationship.mutate(relationship.id)}
                size="icon"
                variant="ghost"
              >
                <Trash2 className="size-4" />
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Users className="size-4" />
          No relationships recorded yet.
        </div>
      )}

      <div className="grid gap-2 border-t pt-4 sm:grid-cols-[1fr_1fr_auto]">
        <Select
          onValueChange={(value) => setRelatedPersonId(value ?? "")}
          value={relatedPersonId}
        >
          <SelectTrigger aria-label="Related person">
            <SelectValue placeholder="Select a person" />
          </SelectTrigger>
          <SelectContent>
            {candidates.map((candidate) => (
              <SelectItem key={candidate.id} value={candidate.id}>
                {candidate.fullName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          onValueChange={(value) => setType((value as RelationshipType) ?? "")}
          value={type}
        >
          <SelectTrigger aria-label="Relationship type">
            <SelectValue placeholder="Relationship type" />
          </SelectTrigger>
          <SelectContent>
            {RELATIONSHIP_TYPE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button disabled={!canSubmit} onClick={handleAdd} type="button">
          Add
        </Button>
      </div>
    </SectionCard>
  );
}
