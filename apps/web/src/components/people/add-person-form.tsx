import { zodResolver } from "@hookform/resolvers/zod";
import {
  DIETARY_PREFERENCES_OPTIONS,
  GENDER_OPTIONS,
  HOUSEHOLD_ROLE_OPTIONS,
  MARITAL_STATUS_OPTIONS,
  MEMBERSHIP_STATUS_OPTIONS,
  SABBATH_SCHOOL_CLASS_OPTIONS,
} from "@sda-chms/shared/constants/people";
import {
  type PersonInsertForm,
  personInsertFormSchema,
} from "@sda-chms/shared/schema/people";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useAddPerson } from "@/hooks/use-people";
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
  const { mutate: addPerson } = useAddPerson({
    onSuccess: () => {
      toast.success("Person added successfully");
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
      firstName: "Jerome",
      lastName: "Marshall",
      gender: "male",
      dateOfBirth: "1998-11-14T18:30:00.000Z",
      phone: "9159115328",
      addressLine1: "No. 23, Abirami Garden",
      city: "HOSUR",
      state: "Tamil Nadu",
      country: "India",
      occupation: "IT Professional",
      maritalStatus: "single",
      membershipStatus: "member",
      dietaryPreference: "none",
      sabbathSchoolClass: "youth",
    },
    // defaultValues: {
    //   maritalStatus: "single",
    //   dietaryPreference: "none",
    //   householdRole: "head",
    // },
  });
  console.log("🚀 ~ AddPersonForm ~ form errors:", form.formState.errors);
  console.log("🚀 ~ AddPersonForm ~ form:", form.watch());

  function onSubmit(data: PersonInsertForm) {
    console.log("🚀 ~ onSubmit ~ data:", data);
    addPerson(data);
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
          <FieldDescription>Who they are at a glance.</FieldDescription>
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
          <FieldDescription>Best ways to reach them.</FieldDescription>
          <FieldGroup className="grid grid-cols-2 gap-4">
            <FormInput form={form} label="Phone" name="phone" />
            <FormInput
              form={form}
              label="Email"
              name="email"
              placeholder="example@email.com"
              type="email"
            />
            <FormInput
              form={form}
              label="Preferred visiting time"
              name="preferredVisitingTime"
              placeholder="e.g., Morning, Afternoon, or specific times"
            />
          </FieldGroup>
        </FieldSet>

        <Separator />

        {/* Section 3: Address */}
        <FieldSet>
          <FieldLegend>Address</FieldLegend>
          <FieldDescription>For visits and mailings.</FieldDescription>
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
          <FieldDescription>Their journey and involvement.</FieldDescription>
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
            <FormSelect
              form={form}
              label="Sabbath School class"
              name="sabbathSchoolClass"
              options={SABBATH_SCHOOL_CLASS_OPTIONS}
              placeholder="Select Sabbath School class"
            />
            {/* <FormMultiSelect
              form={form}
              label="Groups"
              name="groupIds"
              options={(groups || []).map((group) => ({
                value: group.id,
                label: group.name,
              }))}
              placeholder="Select groups"
              search={false}
            /> */}
          </FieldGroup>
        </FieldSet>

        <Separator />

        {/* Section 5: Marital and Family */}
        <FieldSet>
          <FieldLegend>Marital and Family</FieldLegend>
          <FieldDescription>Family and household details.</FieldDescription>
          <FieldGroup className="grid grid-cols-2 gap-4">
            <FormSelect
              form={form}
              label="Marital status"
              name="maritalStatus"
              options={MARITAL_STATUS_OPTIONS}
              placeholder="Select marital status"
            />
            {(form.watch("maritalStatus") === "married" ||
              form.watch("maritalStatus") === "widowed") && (
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
          <FieldDescription>For meal planning at events.</FieldDescription>
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
          <FieldDescription>Any extra details worth noting.</FieldDescription>
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

        <div className="sticky bottom-0 -mb-4 flex justify-center border-t bg-background py-4">
          <Button className={"w-[180px]"} type="submit">
            Add Person
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AddPersonForm;
