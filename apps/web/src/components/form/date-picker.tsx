import { toDate, toDateString } from "@sda-chms/shared/utils/helpers";
import { ChevronDownIcon } from "lucide-react";
import { useState } from "react";
import {
  Controller,
  type FieldValues,
  type Path,
  type UseFormReturn,
} from "react-hook-form";
import { Calendar } from "../ui/calendar";
import { Field, FieldError, FieldLabel } from "../ui/field";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";

interface FormDatePickerProps<T extends FieldValues> {
  form: UseFormReturn<T>;
  name: Path<T>;
  label: string;
}

const FormDatePicker = <T extends FieldValues>({
  form,
  name,
  label,
}: FormDatePickerProps<T>) => {
  const [open, setOpen] = useState(false);

  return (
    <Controller
      control={form.control}
      name={name}
      render={({ field, fieldState }) => {
        const date = toDate(field.value);
        return (
          <Field orientation="vertical">
            <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
            <Popover onOpenChange={setOpen} open={open}>
              <PopoverTrigger
                aria-invalid={fieldState.invalid}
                className="inline-flex h-9 shrink-0 select-none items-center justify-between whitespace-nowrap rounded-4xl border border-input bg-input/30 px-3 font-normal text-sm outline-none transition-all hover:bg-input/50 hover:text-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40"
                id={field.name}
                ref={field.ref}
              >
                {date ? (
                  date.toLocaleDateString()
                ) : (
                  <p className="text-muted-foreground">Select date</p>
                )}
                <ChevronDownIcon className="pointer-events-none size-4 text-muted-foreground" />
              </PopoverTrigger>
              <PopoverContent
                align="start"
                className="w-auto overflow-hidden p-0"
              >
                <Calendar
                  captionLayout="dropdown"
                  defaultMonth={date}
                  mode="single"
                  onSelect={(selectedDate) => {
                    field.onChange(toDateString(selectedDate));
                    setOpen(false);
                  }}
                  selected={date}
                />
              </PopoverContent>
            </Popover>
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        );
      }}
    />
  );
};

export default FormDatePicker;
