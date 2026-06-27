import { flexRender, type Table as TanstackTable } from "@tanstack/react-table";
import type * as React from "react";
import { DataGridColumnHeader } from "@/components/data-grid/data-grid-column-header";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface DataGridProps<TData> extends React.ComponentProps<"div"> {
  table: TanstackTable<TData>;
  height?: number;
}

export function DataGrid<TData>({
  table,
  className,
  height = 600,
  ...props
}: DataGridProps<TData>) {
  const rowHeight = table.options.meta?.rowHeight ?? "short";

  const rowClassName =
    rowHeight === "extra-tall"
      ? "[&_td]:py-5 [&_th]:py-4"
      : rowHeight === "tall"
        ? "[&_td]:py-4 [&_th]:py-3.5"
        : rowHeight === "medium"
          ? "[&_td]:py-3 [&_th]:py-3"
          : "[&_td]:py-2.5 [&_th]:py-2.5";

  return (
    <div
      className={cn("flex h-full w-full flex-col overflow-hidden", className)}
      {...props}
    >
      <ScrollArea className="rounded-md border" style={{ height }}>
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-background">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow className={rowClassName} key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead className="bg-background" key={header.id}>
                    {header.isPlaceholder ? null : typeof header.column
                        .columnDef.header === "string" ? (
                      <DataGridColumnHeader
                        column={header.column}
                        label={header.column.columnDef.header}
                      />
                    ) : (
                      flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  className={cn(
                    rowClassName,
                    row.getIsSelected() && "bg-muted/40 hover:bg-muted/50"
                  )}
                  data-state={row.getIsSelected() ? "selected" : undefined}
                  key={row.id}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  className="h-24 text-center"
                  colSpan={table.getAllColumns().length}
                >
                  No people found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
