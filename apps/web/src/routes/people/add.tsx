import { createFileRoute } from "@tanstack/react-router";
import AddPersonForm from "@/components/people/add-person-form";

export const Route = createFileRoute("/people/add")({
  component: RouteComponent,
  staticData: {
    breadcrumb: "Add",
  },
});

function RouteComponent() {
  return <AddPersonForm />;
}
