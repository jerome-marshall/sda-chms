import { createFileRoute } from "@tanstack/react-router";

import { ComponentExample } from "@/components/component-example";

export const Route = createFileRoute("/example")({
  component: ExampleComponent,
});

function ExampleComponent() {
  return <ComponentExample />;
}
