import { zodResolver } from "@hookform/resolvers/zod";
import {
  type PersonInsertForm,
  personUpdateFormSchema,
} from "@sda-chms/shared/schema/people";
import { useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useUpdatePerson } from "@/hooks/data/use-people";
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

  const form = useForm<PersonInsertForm>({
    resolver: zodResolver(personUpdateFormSchema),
    defaultValues: personDetailToForm(person),
  });

  function onSubmit(data: PersonInsertForm) {
    updatePerson(data);
  }

  return (
    <PersonFormFields
      form={form}
      formId="edit-person-form"
      isSubmitting={isPending}
      onSubmit={onSubmit}
      submitLabel="Save Changes"
    />
  );
};

export default EditPersonForm;
