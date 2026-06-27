"use client";

import type { ColumnSort, Table } from "@tanstack/react-table";
import { ArrowDownUp, GripVertical, Trash2 } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const SORT_ORDERS = [
  { label: "Asc", value: "asc" },
  { label: "Desc", value: "desc" },
];

interface DataGridSortMenuProps<TData>
  extends React.ComponentProps<typeof PopoverContent> {
  table: Table<TData>;
  disabled?: boolean;
}

export function DataGridSortMenu<TData>({
  table,
  disabled,
  ...props
}: DataGridSortMenuProps<TData>) {
  const [open, setOpen] = useState(false);
  const sorting = table.getState().sorting;

  const { columnLabels, columns } = useMemo(() => {
    const labels = new Map<string, string>();
    const sortingIds = new Set(sorting.map((item) => item.id));
    const availableColumns: { id: string; label: string }[] = [];

    for (const column of table.getAllColumns()) {
      if (!column.getCanSort()) continue;

      const label = column.columnDef.meta?.label ?? column.id;
      labels.set(column.id, label);

      if (!sortingIds.has(column.id)) {
        availableColumns.push({ id: column.id, label });
      }
    }

    return { columnLabels: labels, columns: availableColumns };
  }, [sorting, table]);

  const onSortAdd = useCallback(() => {
    const firstColumn = columns[0];
    if (!firstColumn) return;

    table.setSorting((current) => [
      ...current,
      { id: firstColumn.id, desc: false },
    ]);
  }, [columns, table]);

  const onSortUpdate = useCallback(
    (sortId: string, updates: Partial<ColumnSort>) => {
      table.setSorting((current) =>
        current.map((item) =>
          item.id === sortId ? { ...item, ...updates } : item
        )
      );
    },
    [table]
  );

  const onSortRemove = useCallback(
    (sortId: string) => {
      table.setSorting((current) =>
        current.filter((item) => item.id !== sortId)
      );
    },
    [table]
  );

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <PopoverTrigger
        render={
          <Button
            className="font-normal"
            disabled={disabled}
            size="sm"
            variant="outline"
          />
        }
      >
        <ArrowDownUp className="text-muted-foreground" />
        Sort
        {sorting.length > 0 && (
          <Badge
            className="h-[18px] rounded-md px-1.5 font-mono text-[10px]"
            variant="secondary"
          >
            {sorting.length}
          </Badge>
        )}
      </PopoverTrigger>
      <PopoverContent
        className="flex min-w-[380px] flex-col gap-3.5 p-4"
        {...props}
      >
        <div className="flex flex-col gap-1">
          <h4 className="font-medium leading-none">
            {sorting.length > 0 ? "Sort by" : "No sorting applied"}
          </h4>
          <p className="text-muted-foreground text-sm">
            {sorting.length > 0
              ? "Modify sorting to organize your rows."
              : "Add sorting to organize your rows."}
          </p>
        </div>

        {sorting.length > 0 && (
          <div className="flex max-h-[300px] flex-col gap-2 overflow-y-auto p-1">
            {sorting.map((sort) => (
              <div
                className="grid grid-cols-[auto_1fr_120px_auto] items-center gap-2"
                key={sort.id}
              >
                <div className="flex size-9 items-center justify-center rounded-xl border border-border border-dashed text-muted-foreground">
                  <GripVertical className="size-4" />
                </div>
                <Select
                  onValueChange={(value) => {
                    if (!value) return;
                    onSortUpdate(sort.id, { id: value });
                  }}
                  value={sort.id}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[
                      {
                        id: sort.id,
                        label: columnLabels.get(sort.id) ?? sort.id,
                      },
                      ...columns,
                    ].map((column) => (
                      <SelectItem key={column.id} value={column.id}>
                        {column.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  onValueChange={(value) => {
                    if (!value) return;
                    onSortUpdate(sort.id, { desc: value === "desc" });
                  }}
                  value={sort.desc ? "desc" : "asc"}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SORT_ORDERS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  aria-label="Remove sort"
                  onClick={() => onSortRemove(sort.id)}
                  size="icon-sm"
                  variant="ghost"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2">
          <Button
            className="rounded-xl"
            disabled={columns.length === 0}
            onClick={onSortAdd}
            size="sm"
          >
            Add sort
          </Button>
          {sorting.length > 0 && (
            <Button
              className="rounded-xl"
              onClick={() => table.resetSorting()}
              size="sm"
              variant="outline"
            >
              Reset sorting
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
