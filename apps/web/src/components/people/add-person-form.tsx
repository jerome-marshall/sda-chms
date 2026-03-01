import { zodResolver } from "@hookform/resolvers/zod";
import {
  type PersonInsertForm,
  personInsertFormSchema,
} from "@sda-chms/shared/schema/people";
import { useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useAddPerson } from "@/hooks/data/use-people";
import PersonFormFields from "./person-form-fields";

/** Wrapper that initialises the form for creating a new person and handles the add mutation. */
const AddPersonForm = () => {
  const navigate = useNavigate();

  const { mutate: addPerson, isPending } = useAddPerson({
    onSuccess: (person) => {
      toast.success("Person added successfully");
      navigate({ to: "/people/$peopleId", params: { peopleId: person.id } });
    },
    onError: (error) => {
      if (error instanceof Error) {
        let errMessage = "Failed to add person";

        if (error.message.includes("unique_person_identity")) {
          errMessage =
            "A person with the same name and date of birth already exists";
        }
        toast.error(errMessage);
      }
    },
  });

  const form = useForm<PersonInsertForm>({
    resolver: zodResolver(personInsertFormSchema),
    defaultValues: {
      maritalStatus: "single",
      dietaryPreference: "none",
      membershipStatus: "member",
      importantDates: [],
    },
  });

  function onSubmit(data: PersonInsertForm) {
    addPerson(data);
  }

  return (
    <PersonFormFields
      form={form}
      formId="add-person-form"
      isSubmitting={isPending}
      onSubmit={onSubmit}
      submitLabel="Add Person"
    />
  );
};

export default AddPersonForm;
