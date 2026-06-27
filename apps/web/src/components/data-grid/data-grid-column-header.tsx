import type { Column } from "@tanstack/react-table";
import { ChevronDown, ChevronsUpDown, ChevronUp } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface DataGridColumnHeaderProps<TData, TValue> {
  column: Column<TData, TValue>;
  label: string;
}

export function DataGridColumnHeader<TData, TValue>({
  column,
  label,
}: DataGridColumnHeaderProps<TData, TValue>) {
  const sortDirection = column.getIsSorted();

  if (!column.getCanSort()) {
    return <span className="font-medium text-foreground">{label}</span>;
  }

  let sortIcon: ReactNode;
  if (sortDirection === "asc") {
    sortIcon = <ChevronUp className="size-4 text-muted-foreground" />;
  } else if (sortDirection === "desc") {
    sortIcon = <ChevronDown className="size-4 text-muted-foreground" />;
  } else {
    sortIcon = <ChevronsUpDown className="size-4 text-muted-foreground" />;
  }

  return (
    <Button
      className="-ml-2 h-8 rounded-xl px-2 font-medium text-foreground hover:bg-muted/60"
      onClick={() => column.toggleSorting(sortDirection === "asc")}
      size="sm"
      variant="ghost"
    >
      {label}
      {sortIcon}
    </Button>
  );
}
