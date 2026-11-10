import { zodResolver } from "@hookform/resolvers/zod";
import { personInsertFormSchema } from "@sda-chms/shared/schema/people";
import type { PersonInsertForm } from "@sda-chms/shared/schema/people";
import { action as voidAction } from "@void/react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { FetchError } from "void/client";

import type { Households } from "@/types/api";
import { personFormErrorMessage } from "@/utils/people";

import PersonFormFields from "./person-form-fields";

/**
 * Wrapper that initialises the form for creating a new person. Keeps
 * react-hook-form for the field arrays and conditional household fields and
 * submits to the page action, which redirects to the new detail page.
 */
const AddPersonForm = ({ households }: { households: Households }) => {
  const [isPending, setPending] = useState(false);

  const form = useForm<PersonInsertForm>({
    resolver: zodResolver(personInsertFormSchema),
    defaultValues: {
      maritalStatus: "single",
      dietaryPreference: "none",
      membershipStatus: "member",
      importantDates: [],
    },
  });

  async function onSubmit(data: PersonInsertForm) {
    setPending(true);
    try {
      const result = await voidAction("/people/add", {
        data,
        method: "POST",
      });
      if (!result.ok) {
        toast.error(
          personFormErrorMessage(result.error.body, "Failed to add person")
        );
        return;
      }
      toast.success("Person added successfully");
    } catch (error) {
      if (error instanceof FetchError) {
        toast.error(personFormErrorMessage(error.data, "Failed to add person"));
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
      formId="add-person-form"
      households={households}
      isSubmitting={isPending}
      onSubmit={(data) => {
        void onSubmit(data);
      }}
      submitLabel="Add Person"
    />
  );
};

export default AddPersonForm;
