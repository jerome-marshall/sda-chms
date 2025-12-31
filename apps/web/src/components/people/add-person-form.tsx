// import { zodResolver } from "@hookform/resolvers/zod";
// import {
//   type PersonInsert,
//   personInsertSchema,
// } from "@sda-chms/shared/schema/people";
// import { useForm } from "react-hook-form";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "../ui/field";
import { Input } from "../ui/input";

const AddPersonForm = () => {
  // const form = useForm({
  //   resolver: zodResolver(personInsertSchema),
  // });

  // function onSubmit(data: PersonInsert) {
  //   // Do something with the form values.
  //   console.log(data);
  // }

  return (
    <FieldSet>
      <FieldLegend>Profile</FieldLegend>
      <FieldDescription>This appears on invoices and emails.</FieldDescription>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="name">Full name</FieldLabel>
          <Input autoComplete="off" id="name" placeholder="Evil Rabbit" />
          <FieldDescription>
            This appears on invoices and emails.
          </FieldDescription>
        </Field>
        <Field>
          <FieldLabel htmlFor="username">Username</FieldLabel>
          <Input aria-invalid autoComplete="off" id="username" />
          <FieldError>Choose another username.</FieldError>
        </Field>
        <Field orientation="horizontal">
          {/* <Switch id="newsletter" /> */}
          <FieldLabel htmlFor="newsletter">
            Subscribe to the newsletter
          </FieldLabel>
        </Field>
      </FieldGroup>
    </FieldSet>
  );
};

export default AddPersonForm;
