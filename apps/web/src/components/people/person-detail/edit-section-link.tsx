import { Link } from "@tanstack/react-router";
import { Pencil } from "lucide-react";
import { buttonVariants } from "../../ui/button";

interface EditSectionLinkProps {
  personId: string;
}

/** Small edit button that links to the edit person page, used in section card headers. */
export function EditSectionLink({ personId }: EditSectionLinkProps) {
  return (
    <Link
      className={buttonVariants({ size: "icon-sm", variant: "ghost" })}
      params={{ peopleId: personId }}
      to="/people/$peopleId/edit"
    >
      <Pencil className="size-3.5" />
      <span className="sr-only">Edit</span>
    </Link>
  );
}
