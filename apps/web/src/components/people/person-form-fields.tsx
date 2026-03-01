import {
  DIETARY_PREFERENCES_OPTIONS,
  GENDER_OPTIONS,
  HOUSEHOLD_ROLE_OPTIONS,
  IMPORTANT_DATE_CATEGORY_OPTIONS,
  IMPORTANT_DATE_RECURRENCE,
  IMPORTANT_DATE_RECURRENCE_OPTIONS,
  MARITAL_STATUS_OPTIONS,
  MEMBERSHIP_STATUS_OPTIONS,
  SABBATH_SCHOOL_CLASS_OPTIONS,
} from "@sda-chms/shared/constants/people";
import type { PersonInsertForm } from "@sda-chms/shared/schema/people";
import { CalendarPlus, Trash2 } from "lucide-react";
import { type UseFormReturn, useFieldArray } from "react-hook-form";
import { useHouseholds } from "@/hooks/data/use-households";
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

interface PersonFormFieldsProps {
  form: UseFormReturn<PersonInsertForm>;
  onSubmit: (data: PersonInsertForm) => void;
  submitLabel: string;
  isSubmitting?: boolean;
  formId?: string;
}

/** Shared form sections for creating or editing a person. */
const PersonFormFields = ({
  form,
  onSubmit,
  submitLabel,
  isSubmitting,
  formId = "person-form",
}: PersonFormFieldsProps) => {
  const { data: households } = useHouseholds();

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "importantDates",
  });

  function appendImportantDate() {
    append({
      id: crypto.randomUUID(),
      name: "",
      date: "",
      recurrence: IMPORTANT_DATE_RECURRENCE.YEARLY,
      category: undefined,
      notes: "",
    });
  }

  return (
    <div className="mx-auto max-w-2xl">
      <form
        className="space-y-8"
        id={formId}
        onSubmit={form.handleSubmit(onSubmit)}
      >
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
          </FieldGroup>
        </FieldSet>

        <Separator />

        <FieldSet>
          <FieldLegend>Marital and Family</FieldLegend>
          <FieldDescription>Family and household details.</FieldDescription>
          <FieldGroup className="grid grid-cols-2 gap-4">
            <FormSelect
              form={form}
              label="Marital status"
              name="maritalStatus"
              onChange={(value) => {
                if (value === "single") {
                  form.setValue("weddingDate", undefined);
                }
              }}
              options={MARITAL_STATUS_OPTIONS}
              placeholder="Select marital status"
            />
            <FormDatePicker
              disabled={form.watch("maritalStatus") === "single"}
              form={form}
              label="Wedding date"
              name="weddingDate"
            />
          </FieldGroup>
          <FieldGroup className="grid grid-cols-2 gap-4">
            <FormSelect
              form={form}
              label="Household role"
              name="householdRole"
              onChange={(value) => {
                if (value === "head") {
                  form.setValue("householdId", undefined);
                  form.clearErrors("householdId");
                }
              }}
              options={HOUSEHOLD_ROLE_OPTIONS}
              placeholder="Select household role"
            />
            <FormSelect
              disabled={form.watch("householdRole") === "head"}
              form={form}
              label="Household"
              name="householdId"
              options={(households || []).map((household) => ({
                value: household.id,
                label: household.name,
              }))}
              placeholder="Select household"
            />
          </FieldGroup>
          <FieldGroup className="grid grid-cols-2 gap-4">
            <FormInput form={form} label="Occupation" name="occupation" />
          </FieldGroup>
        </FieldSet>

        <Separator />

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

        <FieldSet>
          <div className="flex items-start justify-between gap-4">
            <div>
              <FieldLegend>Important Dates</FieldLegend>
              <FieldDescription>
                Occasions like graduations or business/work anniversaries.
              </FieldDescription>
            </div>
            <Button
              className="shrink-0"
              onClick={appendImportantDate}
              size="sm"
              type="button"
              variant="outline"
            >
              <CalendarPlus className="size-4" />
              Add date
            </Button>
          </div>

          {fields.length === 0 ? (
            <p className="py-2 text-center text-muted-foreground text-sm">
              No important dates added yet.
            </p>
          ) : (
            <div className="flex flex-col gap-4">
              {fields.map((field, index) => (
                <div
                  className="relative rounded-xl border bg-muted/30 p-4"
                  key={field.id}
                >
                  <button
                    className="absolute top-3 right-3 rounded-md p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => remove(index)}
                    type="button"
                  >
                    <Trash2 className="size-4" />
                    <span className="sr-only">Remove date</span>
                  </button>

                  <div className="grid grid-cols-2 gap-4">
                    <FormInput
                      form={form}
                      label="Event name"
                      name={`importantDates.${index}.name`}
                      placeholder="e.g., business/work anniversary, graduation"
                    />
                    <FormDatePicker
                      form={form}
                      label="Date"
                      name={`importantDates.${index}.date`}
                    />
                    <FormSelect
                      form={form}
                      label="Recurrence"
                      name={`importantDates.${index}.recurrence`}
                      options={IMPORTANT_DATE_RECURRENCE_OPTIONS}
                      placeholder="Select recurrence"
                    />
                    <FormSelect
                      form={form}
                      label="Category"
                      name={`importantDates.${index}.category`}
                      options={IMPORTANT_DATE_CATEGORY_OPTIONS}
                      placeholder="Select category"
                    />
                    <div className="col-span-2">
                      <FormTextarea
                        form={form}
                        label="Notes"
                        name={`importantDates.${index}.notes`}
                        placeholder="Any extra context for this date..."
                        rows={2}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </FieldSet>

        <Separator />

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
          <Button className="w-[180px]" disabled={isSubmitting} type="submit">
            {submitLabel}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default PersonFormFields;
