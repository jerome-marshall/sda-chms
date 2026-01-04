import {
  Controller,
  type FieldValues,
  type Path,
  type UseFormReturn,
} from "react-hook-form";
import { Field, FieldError, FieldLabel } from "../ui/field";
import { Input } from "../ui/input";

interface FormInputProps<T extends FieldValues> {
  form: UseFormReturn<T>;
  name: Path<T>;
  label: string;
  placeholder?: string;
  type?: React.HTMLInputTypeAttribute;
}

const FormInput = <T extends FieldValues>({
  form,
  name,
  label,
  placeholder,
  type = "text",
}: FormInputProps<T>) => {
  return (
    <Controller
      control={form.control}
      name={name}
      render={({ field, fieldState }) => (
        <Field>
          <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
          <Input
            {...field}
            aria-invalid={fieldState.invalid}
            autoComplete="off"
            id={field.name}
            placeholder={placeholder}
            type={type}
            value={field.value ?? ""}
          />
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );
};

export default FormInput;
