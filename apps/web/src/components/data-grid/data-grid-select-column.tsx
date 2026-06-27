import type { ColumnDef } from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";

export function getDataGridSelectColumn<TData>(): ColumnDef<TData> {
  return {
    id: "select",
    header: ({ table }) => (
      <div className="flex items-center gap-3 pl-1">
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(checked) =>
            table.toggleAllPageRowsSelected(Boolean(checked))
          }
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex items-center gap-3 pl-1">
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(checked) => row.toggleSelected(Boolean(checked))}
        />
        <span className="min-w-4 text-muted-foreground text-xs tabular-nums">
          {row.index + 1}
        </span>
      </div>
    ),
    enableSorting: false,
    enableColumnFilter: false,
    enableHiding: false,
    size: 72,
  };
}
