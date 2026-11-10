import { zodResolver } from "@hookform/resolvers/zod";
import { RELATIONSHIP_TYPE } from "@sda-chms/shared/constants/people";
import { personInsertFormSchema } from "@sda-chms/shared/schema/people";
import type { PersonInsertForm } from "@sda-chms/shared/schema/people";
import { action as voidAction } from "@void/react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { FetchError } from "void/client";

import type { Households, People, Person, Relationships } from "@/types/api";
import { personToForm, personFormErrorMessage } from "@/utils/people";

import PersonFormFields from "./person-form-fields";

interface EditPersonFormProps {
  person: Person;
  relationships: Relationships;
  households: Households;
  people: People;
}

/**
 * Wrapper that pre-fills the form with existing person data. Keeps
 * react-hook-form for the same reasons as the add form and submits to the
 * page action, which redirects back to the detail page.
 */
const EditPersonForm = ({
  person,
  relationships,
  households,
  people,
}: EditPersonFormProps) => {
  const [isPending, setPending] = useState(false);
  const maritalStatusLocked = (relationships ?? []).some(
    (relationship) => relationship.type === RELATIONSHIP_TYPE.SPOUSE
  );

  const form = useForm<PersonInsertForm>({
    resolver: zodResolver(personInsertFormSchema),
    defaultValues: personToForm(person),
  });

  // Keep the submitted Marital Status in sync when a spouse link is added or
  // its state changes on this page — the field is locked and would otherwise
  // still post the stale value.
  useEffect(() => {
    const spouseState = (relationships ?? []).find(
      (relationship) =>
        relationship.type === RELATIONSHIP_TYPE.SPOUSE && relationship.state
    )?.state;
    if (spouseState) {
      form.setValue("maritalStatus", spouseState);
    }
  }, [form, relationships]);

  async function onSubmit(data: PersonInsertForm) {
    setPending(true);
    try {
      const result = await voidAction("/people/:id/edit", {
        params: { id: person.id },
        data,
        method: "PUT",
      });
      if (!result.ok) {
        toast.error(
          personFormErrorMessage(result.error.body, "Failed to update person")
        );
        return;
      }
      toast.success("Person updated successfully");
    } catch (error) {
      if (error instanceof FetchError) {
        toast.error(
          personFormErrorMessage(error.data, "Failed to update person")
        );
        return;
      }
      if (error instanceof Error) {
        toast.error(error.message);
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <PersonFormFields
      form={form}
      formId="edit-person-form"
      households={households}
      isSubmitting={isPending}
      maritalStatusLocked={maritalStatusLocked}
      onSubmit={(data) => {
        void onSubmit(data);
      }}
      people={people}
      person={person}
      relationships={relationships}
      submitLabel="Save Changes"
    />
  );
};

export default EditPersonForm;
