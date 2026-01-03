import {
  Controller,
  type FieldValues,
  type Path,
  type UseFormReturn,
} from "react-hook-form";
import { Field, FieldError, FieldLabel } from "../ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

interface FormSelectProps<T extends FieldValues> {
  form: UseFormReturn<T>;
  name: Path<T>;
  label: string;
  options: { value: string; label: string }[];
  placeholder?: string;
  multiple?: boolean;
}

const FormSelect = <T extends FieldValues>({
  form,
  name,
  label,
  options,
  placeholder,
  multiple = false,
}: FormSelectProps<T>) => {
  return (
    <Controller
      control={form.control}
      name={name}
      render={({ field, fieldState }) => {
        const selectedOptions = options.filter((option) =>
          Array.isArray(field.value)
            ? field.value.includes(option.value)
            : field.value === option.value
        );

        return (
          <Field orientation="vertical">
            <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
            <Select
              multiple={multiple}
              name={field.name}
              onValueChange={field.onChange}
              value={field.value}
            >
              <SelectTrigger aria-invalid={fieldState.invalid} id={field.name}>
                {selectedOptions.length > 0 ? (
                  selectedOptions.map((option) => option.label).join(", ")
                ) : (
                  <SelectValue>{placeholder}</SelectValue>
                )}
              </SelectTrigger>
              <SelectContent>
                {options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        );
      }}
    />
  );
};

export default FormSelect;
