import type { Column } from "@tanstack/react-table";
import { ChevronDown, ChevronsUpDown, ChevronUp } from "lucide-react";
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

  return (
    <Button
      className="-ml-2 h-8 rounded-xl px-2 font-medium text-foreground hover:bg-muted/60"
      onClick={() => column.toggleSorting(sortDirection === "asc")}
      size="sm"
      variant="ghost"
    >
      {label}
      {sortDirection === "asc" ? (
        <ChevronUp className="size-4 text-muted-foreground" />
      ) : sortDirection === "desc" ? (
        <ChevronDown className="size-4 text-muted-foreground" />
      ) : (
        <ChevronsUpDown className="size-4 text-muted-foreground" />
      )}
    </Button>
  );
}
