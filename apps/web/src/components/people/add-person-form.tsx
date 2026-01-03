import { zodResolver } from "@hookform/resolvers/zod";
import {
  DIETARY_PREFERENCES,
  GENDER,
  GENDER_OPTIONS,
  HOUSEHOLD_ROLE,
  MARITAL_STATUS,
  MEMBERSHIP_STATUS,
} from "@sda-chms/shared/constants/people";
import {
  type PersonInsertForm,
  personInsertFormSchema,
} from "@sda-chms/shared/schema/people";
import { useForm } from "react-hook-form";
import FormDatePicker from "../form/date-picker";
import FormInput from "../form/input";
import FormSelect from "../form/select";
import { Button } from "../ui/button";
import {
  FieldDescription,
  FieldGroup,
  FieldLegend,
  FieldSet,
} from "../ui/field";

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
  console.log("🚀 ~ AddPersonForm ~ form errors:", form.formState.errors);
  console.log("🚀 ~ AddPersonForm ~ form:", form.watch());

  function onSubmit(data: PersonInsertForm) {
    console.log("🚀 ~ onSubmit ~ data:", data);
    // Do something with the form values.
  }

  return (
    <div className="mx-auto max-w-2xl">
      <FieldSet>
        <FieldLegend>Personal Information</FieldLegend>
        <FieldDescription>
          This information will be used to identify the person and contact them.
        </FieldDescription>
        <form
          className="space-y-4"
          id="add-person-form"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <FieldGroup className="grid grid-cols-2 gap-4">
            <FormInput form={form} label="First name" name="firstName" />
            <FormInput form={form} label="Last name" name="lastName" />
            <FormInput
              form={form}
              label="Preferred name"
              name="preferredName"
            />
            <FormSelect
              form={form}
              label="Gender"
              name="gender"
              options={GENDER_OPTIONS}
            />
            <FormDatePicker
              form={form}
              label="Date of birth"
              name="dateOfBirth"
            />
          </FieldGroup>
          <FieldGroup className="grid grid-cols-2 gap-4">
            <FormInput form={form} label="Phone" name="phone" />
            <FormInput form={form} label="Email" name="email" />
          </FieldGroup>
          <FieldGroup className="grid grid-cols-2 gap-4">
            <FormInput form={form} label="Address line 1" name="addressLine1" />
            <FormInput form={form} label="Address line 2" name="addressLine2" />
            <FormInput form={form} label="City" name="city" />
          </FieldGroup>
          <Button type="submit">Add Person</Button>
        </form>
      </FieldSet>
    </div>
  );
};

export default AddPersonForm;
