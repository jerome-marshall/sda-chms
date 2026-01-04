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
}

const FormSelect = <T extends FieldValues>({
  form,
  name,
  label,
  options,
  placeholder,
}: FormSelectProps<T>) => {
  return (
    <Controller
      control={form.control}
      name={name}
      render={({ field, fieldState }) => (
        <Field orientation="vertical">
          <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
          <Select
            name={field.name}
            onValueChange={field.onChange}
            value={field.value ?? ""}
          >
            <SelectTrigger aria-invalid={fieldState.invalid} id={field.name}>
              {options.find((option) => option.value === field.value)
                ?.label || <SelectValue>{placeholder}</SelectValue>}
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
};

export default FormSelect;
