import { zodResolver } from "@hookform/resolvers/zod";
import { RELATIONSHIP_TYPE } from "@sda-chms/shared/constants/people";
import {
  type PersonInsertForm,
  personUpdateFormSchema,
} from "@sda-chms/shared/schema/people";
import { useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useUpdatePerson } from "@/hooks/data/use-people";
import { useRelationships } from "@/hooks/data/use-relationships";
import { ApiError } from "@/lib/api";
import type { PersonDetail } from "@/types/api";
import { personDetailToForm } from "@/utils/people";
import PersonFormFields from "./person-form-fields";

interface EditPersonFormProps {
  person: PersonDetail;
}

/** Wrapper that pre-fills the form with existing person data and handles the update mutation. */
const EditPersonForm = ({ person }: EditPersonFormProps) => {
  const navigate = useNavigate();

  const { mutate: updatePerson, isPending } = useUpdatePerson({
    personId: person.id,
    onSuccess: (updatedPerson) => {
      toast.success("Person updated successfully");
      navigate({
        to: "/people/$peopleId",
        params: { peopleId: updatedPerson.id },
      });
    },
    onError: (error) => {
      if (error instanceof ApiError) {
        toast.error(error.message);
        return;
      }
      if (error instanceof Error) {
        let errMessage = "Failed to update person";

        if (error.message.includes("unique_person_identity")) {
          errMessage =
            "A person with the same name and date of birth already exists";
        }
        toast.error(errMessage);
      }
    },
  });

  const { data: relationships } = useRelationships(person.id);
  const maritalStatusLocked = (relationships ?? []).some(
    (relationship) => relationship.type === RELATIONSHIP_TYPE.SPOUSE
  );

  const form = useForm<PersonInsertForm>({
    resolver: zodResolver(personUpdateFormSchema),
    defaultValues: personDetailToForm(person),
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

  function onSubmit(data: PersonInsertForm) {
    updatePerson(data);
  }

  return (
    <PersonFormFields
      form={form}
      formId="edit-person-form"
      isSubmitting={isPending}
      maritalStatusLocked={maritalStatusLocked}
      onSubmit={onSubmit}
      person={person}
      submitLabel="Save Changes"
    />
  );
};

export default EditPersonForm;
