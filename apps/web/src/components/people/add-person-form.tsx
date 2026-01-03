import { zodResolver } from "@hookform/resolvers/zod";
import {
  DIETARY_PREFERENCES,
  DIETARY_PREFERENCES_OPTIONS,
  GENDER_OPTIONS,
  HOUSEHOLD_ROLE,
  HOUSEHOLD_ROLE_OPTIONS,
  MARITAL_STATUS,
  MARITAL_STATUS_OPTIONS,
  MEMBERSHIP_STATUS,
  MEMBERSHIP_STATUS_OPTIONS,
} from "@sda-chms/shared/constants/people";
import {
  type PersonInsertForm,
  personInsertFormSchema,
} from "@sda-chms/shared/schema/people";
import { useForm } from "react-hook-form";
import { useGroups } from "@/hooks/use-groups";
import FormDatePicker from "../form/date-picker";
import FormInput from "../form/input";
import FormSelect from "../form/select";
import FormTextarea from "../form/textarea";
import { Button } from "../ui/button";
import {
  FieldDescription,
  FieldGroup,
  FieldLegend,
  FieldSet,
} from "../ui/field";
import { Separator } from "../ui/separator";

const AddPersonForm = () => {
  const { data: groups } = useGroups();

  const form = useForm<PersonInsertForm>({
    resolver: zodResolver(personInsertFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      preferredName: "",
      gender: "male",
      dateOfBirth: undefined,
      photoUrl: undefined,
      phone: "",
      email: undefined,
      addressLine1: "",
      addressLine2: undefined,
      city: "",
      state: "",
      country: "",
      occupation: "",
      maritalStatus: MARITAL_STATUS.SINGLE,
      weddingDate: undefined,
      memorialDay: undefined,
      baptismDate: undefined,
      baptismPlace: undefined,
      membershipStatus: MEMBERSHIP_STATUS.VISITOR,
      dateJoinedChurch: undefined,
      dietaryPreference: DIETARY_PREFERENCES.NONE,
      householdRole: HOUSEHOLD_ROLE.OTHER,
      sabbathSchoolClassId: "",
      visitationNotes: undefined,
      pastoralNotes: undefined,
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
      <form
        className="space-y-8"
        id="add-person-form"
        onSubmit={form.handleSubmit(onSubmit)}
      >
        {/* Section 1: Personal Information */}
        <FieldSet>
          <FieldLegend>Personal Information</FieldLegend>
          <FieldDescription>
            Basic information to identify the person.
          </FieldDescription>
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
              placeholder="Select gender"
            />
            <FormDatePicker
              form={form}
              label="Date of birth"
              name="dateOfBirth"
            />
            <FormInput
              form={form}
              label="Photo URL"
              name="photoUrl"
              placeholder="https://example.com/photo.jpg"
              type="url"
            />
          </FieldGroup>
        </FieldSet>

        <Separator />

        {/* Section 2: Contact Details */}
        <FieldSet>
          <FieldLegend>Contact Details</FieldLegend>
          <FieldDescription>
            Phone and email information for contacting the person.
          </FieldDescription>
          <FieldGroup className="grid grid-cols-2 gap-4">
            <FormInput form={form} label="Phone" name="phone" />
            <FormInput
              form={form}
              label="Email"
              name="email"
              placeholder="example@email.com"
              type="email"
            />
          </FieldGroup>
        </FieldSet>

        <Separator />

        {/* Section 3: Address */}
        <FieldSet>
          <FieldLegend>Address</FieldLegend>
          <FieldDescription>Physical address information.</FieldDescription>
          <FieldGroup className="grid grid-cols-2 gap-4">
            <FormInput form={form} label="Address line 1" name="addressLine1" />
            <FormInput form={form} label="Address line 2" name="addressLine2" />
            <FormInput form={form} label="City" name="city" />
            <FormInput form={form} label="State" name="state" />
            <FormInput form={form} label="Country" name="country" />
          </FieldGroup>
        </FieldSet>

        <Separator />

        {/* Section 4: Church Membership */}
        <FieldSet>
          <FieldLegend>Church Membership</FieldLegend>
          <FieldDescription>
            Membership status and church-related information.
          </FieldDescription>
          <FieldGroup className="grid grid-cols-2 gap-4">
            <FormSelect
              form={form}
              label="Membership status"
              name="membershipStatus"
              options={MEMBERSHIP_STATUS_OPTIONS}
              placeholder="Select membership status"
            />
            <FormDatePicker
              form={form}
              label="Date joined church"
              name="dateJoinedChurch"
            />
            <FormDatePicker
              form={form}
              label="Baptism date"
              name="baptismDate"
            />
            <FormInput form={form} label="Baptism place" name="baptismPlace" />
            <FormInput
              form={form}
              label="Sabbath School"
              name="sabbathSchoolClassId"
            />
            <FormSelect
              form={form}
              label="Groups"
              multiple
              name="groupIds"
              options={(groups || []).map((group) => ({
                value: group.id,
                label: group.name,
              }))}
              placeholder="Select membership status"
            />
          </FieldGroup>
        </FieldSet>

        <Separator />

        {/* Section 5: Marital and Family */}
        <FieldSet>
          <FieldLegend>Marital and Family</FieldLegend>
          <FieldDescription>
            Marital status, family role, and occupation information.
          </FieldDescription>
          <FieldGroup className="grid grid-cols-2 gap-4">
            <FormSelect
              form={form}
              label="Marital status"
              name="maritalStatus"
              options={MARITAL_STATUS_OPTIONS}
              placeholder="Select marital status"
            />
            {form.watch("maritalStatus") === "married" && (
              <FormDatePicker
                form={form}
                label="Wedding date"
                name="weddingDate"
              />
            )}
          </FieldGroup>
          <FieldGroup className="grid grid-cols-2 gap-4">
            <FormSelect
              form={form}
              label="Household role"
              name="householdRole"
              options={HOUSEHOLD_ROLE_OPTIONS}
              placeholder="Select household role"
            />
            <FormInput form={form} label="Occupation" name="occupation" />
          </FieldGroup>
        </FieldSet>

        <Separator />

        {/* Section 6: Dietary Preferences */}
        <FieldSet>
          <FieldLegend>Dietary Preferences</FieldLegend>
          <FieldDescription>
            Dietary restrictions or preferences for events and meals.
          </FieldDescription>
          <FieldGroup className="grid grid-cols-2 gap-4">
            <FormSelect
              form={form}
              label="Dietary preference"
              name="dietaryPreference"
              options={DIETARY_PREFERENCES_OPTIONS}
              placeholder="Select dietary preference"
            />
          </FieldGroup>
        </FieldSet>

        <Separator />

        {/* Section 7: Notes */}
        <FieldSet>
          <FieldLegend>Additional Notes</FieldLegend>
          <FieldDescription>
            Optional notes and memorial information.
          </FieldDescription>
          <FieldGroup className="grid grid-cols-1 gap-4">
            <FormDatePicker
              form={form}
              label="Memorial day"
              name="memorialDay"
            />
            <FormTextarea
              form={form}
              label="Visitation notes"
              name="visitationNotes"
              placeholder="Add any visitation-related notes..."
              rows={4}
            />
            <FormTextarea
              form={form}
              label="Pastoral notes"
              name="pastoralNotes"
              placeholder="Add any pastoral notes..."
              rows={4}
            />
          </FieldGroup>
        </FieldSet>

        <div className="flex justify-end">
          <Button type="submit">Add Person</Button>
        </div>
      </form>
    </div>
  );
};

export default AddPersonForm;
