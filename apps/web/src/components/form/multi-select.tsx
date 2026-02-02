import {
  Controller,
  type FieldValues,
  type Path,
  type UseFormReturn,
} from "react-hook-form";
import { Field, FieldError, FieldLabel } from "../ui/field";
import {
  MultiSelect,
  MultiSelectContent,
  MultiSelectItem,
  MultiSelectTrigger,
  MultiSelectValue,
} from "../ui/multi-select";

interface FormMultiSelectProps<T extends FieldValues> {
  form: UseFormReturn<T>;
  name: Path<T>;
  label: string;
  options: { value: string; label: string }[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  search?: boolean;
}

const FormMultiSelect = <T extends FieldValues>({
  form,
  name,
  label,
  options,
  placeholder,
  search = false,
  searchPlaceholder = "Search...",
  emptyMessage = "No results found",
}: FormMultiSelectProps<T>) => {
  return (
    <Controller
      control={form.control}
      name={name}
      render={({ field, fieldState }) => (
        <Field orientation="vertical">
          <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
          <MultiSelect
            onValuesChange={field.onChange}
            values={field.value ?? []}
          >
            <MultiSelectTrigger
              aria-invalid={fieldState.invalid}
              className="w-full"
              id={field.name}
              ref={field.ref}
            >
              <MultiSelectValue
                overflowBehavior={"cutoff"}
                placeholder={placeholder}
              />
            </MultiSelectTrigger>
            <MultiSelectContent
              search={
                search
                  ? {
                      placeholder: searchPlaceholder,
                      emptyMessage,
                    }
                  : false
              }
            >
              {options.map((option) => (
                <MultiSelectItem key={option.value} value={option.value}>
                  {option.label}
                </MultiSelectItem>
              ))}
            </MultiSelectContent>
          </MultiSelect>
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );
};

export default FormMultiSelect;
