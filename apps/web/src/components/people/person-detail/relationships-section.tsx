import {
  HOUSEHOLD_ROLE,
  RELATIONSHIP_TYPE,
  RELATIONSHIP_TYPE_OPTIONS,
  type RELATIONSHIP_TYPE_VALUES,
  SPOUSE_STATE_OPTIONS,
  type SPOUSE_STATE_VALUES,
} from "@sda-chms/shared/constants/people";
import { Sparkles, Trash2, Users } from "lucide-react";
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
  useUpdateRelationshipState,
} from "@/hooks/data/use-relationships";
import type { PersonDetail } from "@/types/api";
import { SectionCard } from "./section-card";
import { formatLabel, getInitials } from "./utils";

type RelationshipType = (typeof RELATIONSHIP_TYPE_VALUES)[number];
type SpouseState = (typeof SPOUSE_STATE_VALUES)[number];

/**
 * The Household Role whose holder is the likely spouse of a given role: a Head's
 * Spouse and vice versa. Any other role (or none) has no spouse pre-fill.
 */
const COMPLEMENTARY_SPOUSE_ROLE: Record<
  string,
  (typeof HOUSEHOLD_ROLE)[keyof typeof HOUSEHOLD_ROLE] | undefined
> = {
  [HOUSEHOLD_ROLE.HEAD]: HOUSEHOLD_ROLE.SPOUSE,
  [HOUSEHOLD_ROLE.SPOUSE]: HOUSEHOLD_ROLE.HEAD,
};

interface RelationshipsSectionProps {
  person: PersonDetail;
}

/** Lists a Person's relationships and lets the user add or remove them (ADR-0003). */
export function RelationshipsSection({ person }: RelationshipsSectionProps) {
  const { data: relationships } = useRelationships(person.id);
  const { data: people } = usePeople();

  const [relatedPersonId, setRelatedPersonId] = useState("");
  const [type, setType] = useState<RelationshipType | "">("");
  const [state, setState] = useState<SpouseState>("married");

  const addRelationship = useAddRelationship({
    onSuccess: () => {
      setRelatedPersonId("");
      setType("");
      setState("married");
    },
  });
  const removeRelationship = useRemoveRelationship();
  const updateRelationshipState = useUpdateRelationshipState();

  // Anyone but this person is a valid link target.
  const candidates = (people ?? []).filter((p) => p.id !== person.id);

  // Household Head + Spouse roles suggest a spouse link but never imply one
  // (ADR-0003): offer to pre-fill it, but it is only stored once the user adds
  // it, and remains editable afterwards. The complementary role — a Head's
  // Spouse, or a Spouse's Head — in the same household is the pre-fill target,
  // unless a spouse link to them already exists.
  const complementaryRole = person.householdRole
    ? COMPLEMENTARY_SPOUSE_ROLE[person.householdRole]
    : undefined;
  const alreadyLinkedIds = new Set(
    (relationships ?? [])
      .filter((r) => r.type === RELATIONSHIP_TYPE.SPOUSE)
      .map((r) => r.relatedPerson.id)
  );
  const spousePrefill =
    complementaryRole && person.householdId
      ? candidates.find(
          (p) =>
            p.householdId === person.householdId &&
            p.householdRole === complementaryRole &&
            !alreadyLinkedIds.has(p.id)
        )
      : undefined;

  const isSpouse = type === RELATIONSHIP_TYPE.SPOUSE;
  const canSubmit = relatedPersonId && type && !addRelationship.isPending;

  const handleAdd = () => {
    if (!(relatedPersonId && type)) {
      return;
    }
    addRelationship.mutate({
      personId: person.id,
      relatedPersonId,
      type,
      // Only spouse links carry a lifecycle state (ADR-0003).
      ...(isSpouse ? { state } : {}),
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
              {relationship.type === RELATIONSHIP_TYPE.SPOUSE &&
              relationship.state ? (
                <Select
                  onValueChange={(value) =>
                    updateRelationshipState.mutate({
                      id: relationship.id,
                      state: value as SpouseState,
                    })
                  }
                  value={relationship.state}
                >
                  <SelectTrigger aria-label="Spouse lifecycle state">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SPOUSE_STATE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : null}
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

      {spousePrefill ? (
        <div className="flex items-center justify-between gap-2 rounded-lg border border-dashed p-2">
          <p className="text-muted-foreground text-xs">
            {spousePrefill.fullName} is this household's{" "}
            {formatLabel(complementaryRole ?? "")}. Pre-fill a spouse link?
          </p>
          <Button
            onClick={() => {
              setRelatedPersonId(spousePrefill.id);
              setType(RELATIONSHIP_TYPE.SPOUSE);
              setState("married");
            }}
            size="sm"
            type="button"
            variant="outline"
          >
            <Sparkles className="size-4" />
            Pre-fill
          </Button>
        </div>
      ) : null}

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

        {isSpouse ? (
          <Select
            onValueChange={(value) => setState(value as SpouseState)}
            value={state}
          >
            <SelectTrigger
              aria-label="Spouse lifecycle state"
              className="sm:col-span-3"
            >
              <SelectValue placeholder="Lifecycle state" />
            </SelectTrigger>
            <SelectContent>
              {SPOUSE_STATE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : null}
      </div>
    </SectionCard>
  );
}
