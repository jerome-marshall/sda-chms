import { zodResolver } from "@hookform/resolvers/zod";
import {
  DIETARY_PREFERENCES,
  GENDER,
  HOUSEHOLD_ROLE,
  MARITAL_STATUS,
  MEMBERSHIP_STATUS,
} from "@sda-chms/shared/constants/people";
import {
  type PersonInsertForm,
  personInsertFormSchema,
} from "@sda-chms/shared/schema/people";
import { Controller, useForm } from "react-hook-form";
import { Button } from "../ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "../ui/field";
import { Input } from "../ui/input";

const AddPersonForm = () => {
  const form = useForm<PersonInsertForm>({
    resolver: zodResolver(personInsertFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      preferredName: "",
      gender: GENDER.MALE,
      phone: "",
      addressLine1: "",
      addressLine2: undefined,
      city: "",
      state: "",
      country: "",
      occupation: "",
      maritalStatus: MARITAL_STATUS.SINGLE,
      membershipStatus: MEMBERSHIP_STATUS.VISITOR,
      dietaryPreference: DIETARY_PREFERENCES.NONE,
      householdRole: HOUSEHOLD_ROLE.OTHER,
    },
  });
  console.log("🚀 ~ AddPersonForm ~ form:", form.formState.errors);

  function onSubmit(data: PersonInsertForm) {
    console.log("🚀 ~ onSubmit ~ data:", data);
    // Do something with the form values.
  }

  return (
    <div className="mx-auto max-w-2xl">
      <FieldSet>
        <FieldLegend>Profile</FieldLegend>
        <FieldDescription>
          This appears on invoices and emails.
        </FieldDescription>
        <form id="add-person-form" onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup className="grid grid-cols-2 gap-4">
            <Controller
              control={form.control}
              name="firstName"
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>Full name</FieldLabel>
                  <Input
                    {...field}
                    aria-invalid={fieldState.invalid}
                    autoComplete="off"
                    id={field.name}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Field>
              <FieldLabel htmlFor="username">Username</FieldLabel>
              <Input aria-invalid autoComplete="off" id="username" />
              <FieldError>Choose another username.</FieldError>
            </Field>
          </FieldGroup>
          <Button type="submit">Add Person</Button>
        </form>
      </FieldSet>
    </div>
  );
};

export default AddPersonForm;
