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
  defaultValue?: string;
  disabled?: boolean;
  form: UseFormReturn<T>;
  label: string;
  name: Path<T>;
  onChange?: (value: string | null) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
}

/** Controlled select field integrated with react-hook-form. */
const FormSelect = <T extends FieldValues>({
  form,
  name,
  label,
  options,
  placeholder,
  disabled,
  onChange,
  defaultValue,
}: FormSelectProps<T>) => (
  <Controller
    control={form.control}
    name={name}
    render={({ field, fieldState }) => (
      <Field orientation="vertical">
        <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
        <Select
          defaultValue={defaultValue}
          disabled={disabled}
          name={field.name}
          onValueChange={(value) => {
            field.onChange(value);
            onChange?.(value);
          }}
          value={field.value ?? ""}
        >
          <SelectTrigger
            aria-invalid={fieldState.invalid}
            id={field.name}
            ref={field.ref}
          >
            {options.find((option) => option.value === field.value)?.label || (
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
    )}
  />
);

export default FormSelect;
