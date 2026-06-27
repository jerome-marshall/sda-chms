"use client";

import type { ColumnFilter, Table } from "@tanstack/react-table";
import { GripVertical, ListFilter, Trash2 } from "lucide-react";
import type { ReactNode } from "react";
import { useCallback, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  getDataGridColumnVariant,
  getDefaultOperator,
  getOperatorsForVariant,
} from "@/lib/data-grid-filters";
import type { FilterOperator, FilterValue } from "@/types/data-grid";

const OPERATORS_WITHOUT_VALUE = new Set([
  "isEmpty",
  "isNotEmpty",
  "isTrue",
  "isFalse",
]);

interface DataGridFilterMenuProps<TData>
  extends React.ComponentProps<typeof PopoverContent> {
  table: Table<TData>;
  disabled?: boolean;
}

export function DataGridFilterMenu<TData>({
  table,
  disabled,
  ...props
}: DataGridFilterMenuProps<TData>) {
  const [open, setOpen] = useState(false);
  const columnFilters = table.getState().columnFilters;

  const { columnLabels, columns, columnVariants } = useMemo(() => {
    const labels = new Map<string, string>();
    const variants = new Map<string, string>();
    const filteringIds = new Set(columnFilters.map((item) => item.id));
    const availableColumns: { id: string; label: string }[] = [];

    for (const column of table.getAllColumns()) {
      if (!column.getCanFilter()) {
        continue;
      }

      const label = column.columnDef.meta?.label ?? column.id;
      labels.set(column.id, label);
      variants.set(column.id, getDataGridColumnVariant(column));

      if (!filteringIds.has(column.id)) {
        availableColumns.push({ id: column.id, label });
      }
    }

    return {
      columnLabels: labels,
      columns: availableColumns,
      columnVariants: variants,
    };
  }, [columnFilters, table]);

  const onFilterAdd = useCallback(() => {
    const firstColumn = columns[0];
    if (!firstColumn) {
      return;
    }

    const variant = columnVariants.get(firstColumn.id) ?? "short-text";
    const defaultOperator = getDefaultOperator(variant);

    table.setColumnFilters((current) => [
      ...current,
      { id: firstColumn.id, value: { operator: defaultOperator, value: "" } },
    ]);
  }, [columnVariants, columns, table]);

  const onFilterUpdate = useCallback(
    (filterId: string, updates: Partial<ColumnFilter>) => {
      table.setColumnFilters((current) =>
        current.map((item) =>
          item.id === filterId ? { ...item, ...updates } : item
        )
      );
    },
    [table]
  );

  const onFilterRemove = useCallback(
    (filterId: string) => {
      table.setColumnFilters((current) =>
        current.filter((item) => item.id !== filterId)
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
        <ListFilter className="text-muted-foreground" />
        Filter
        {columnFilters.length > 0 && (
          <Badge
            className="h-[18px] rounded-md px-1.5 font-mono text-[10px]"
            variant="secondary"
          >
            {columnFilters.length}
          </Badge>
        )}
      </PopoverTrigger>
      <PopoverContent
        className="flex min-w-[520px] flex-col gap-3.5 p-4"
        {...props}
      >
        <div className="flex flex-col gap-1">
          <h4 className="font-medium leading-none">
            {columnFilters.length > 0 ? "Filter by" : "No filters applied"}
          </h4>
          <p className="text-muted-foreground text-sm">
            {columnFilters.length > 0
              ? "Modify filters to narrow down your people."
              : "Add filters to narrow down your people."}
          </p>
        </div>

        {columnFilters.length > 0 && (
          <div className="flex max-h-[360px] flex-col gap-2 overflow-y-auto p-1">
            {columnFilters.map((filter) => (
              <DataGridFilterItem
                columnLabels={columnLabels}
                columns={columns}
                columnVariants={columnVariants}
                filter={filter}
                key={filter.id}
                onFilterRemove={onFilterRemove}
                onFilterUpdate={onFilterUpdate}
                table={table}
              />
            ))}
          </div>
        )}

        <div className="flex items-center gap-2">
          <Button
            className="rounded-xl"
            disabled={columns.length === 0}
            onClick={onFilterAdd}
            size="sm"
          >
            Add filter
          </Button>
          {columnFilters.length > 0 && (
            <Button
              className="rounded-xl"
              onClick={() => table.resetColumnFilters()}
              size="sm"
              variant="outline"
            >
              Reset filters
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

interface DataGridFilterItemProps<TData> {
  table: Table<TData>;
  filter: ColumnFilter;
  columns: Array<{ id: string; label: string }>;
  columnLabels: Map<string, string>;
  columnVariants: Map<string, string>;
  onFilterUpdate: (filterId: string, updates: Partial<ColumnFilter>) => void;
  onFilterRemove: (filterId: string) => void;
}

function DataGridFilterItem<TData>({
  table,
  filter,
  columns,
  columnLabels,
  columnVariants,
  onFilterUpdate,
  onFilterRemove,
}: DataGridFilterItemProps<TData>) {
  const variant = columnVariants.get(filter.id) ?? "short-text";
  const operators = getOperatorsForVariant(variant);
  const filterValue = (filter.value as FilterValue | undefined) ?? {
    operator: getDefaultOperator(variant),
    value: "",
  };
  const column = table.getColumn(filter.id);
  const selectOptions = column?.columnDef.meta?.options ?? [];

  let valueInput: ReactNode;
  if (OPERATORS_WITHOUT_VALUE.has(filterValue.operator)) {
    valueInput = (
      <div className="h-9 rounded-4xl border border-input border-dashed bg-input/10" />
    );
  } else if (variant === "select" || variant === "multi-select") {
    valueInput = (
      <Select
        onValueChange={(value) => {
          if (!value) {
            return;
          }

          onFilterUpdate(filter.id, {
            value: { ...filterValue, value },
          });
        }}
        value={String(filterValue.value ?? "")}
      >
        <SelectTrigger>
          <SelectValue placeholder="Value" />
        </SelectTrigger>
        <SelectContent>
          {selectOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  } else {
    valueInput = (
      <Input
        onChange={(event) =>
          onFilterUpdate(filter.id, {
            value: { ...filterValue, value: event.target.value },
          })
        }
        placeholder="Value"
        value={String(filterValue.value ?? "")}
      />
    );
  }

  return (
    <div className="grid grid-cols-[auto_72px_1fr_1fr_auto] items-center gap-2">
      <div className="flex size-9 items-center justify-center rounded-xl border border-border border-dashed text-muted-foreground">
        <GripVertical className="size-4" />
      </div>
      <span className="text-muted-foreground text-sm">Where</span>
      <Select
        onValueChange={(value) => {
          if (!value) {
            return;
          }
          const nextVariant = columnVariants.get(value) ?? "short-text";
          onFilterUpdate(filter.id, {
            id: value,
            value: {
              operator: getDefaultOperator(nextVariant),
              value: "",
            },
          });
        }}
        value={filter.id}
      >
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {[
            { id: filter.id, label: columnLabels.get(filter.id) ?? filter.id },
            ...columns,
          ].map((columnOption) => (
            <SelectItem key={columnOption.id} value={columnOption.id}>
              {columnOption.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        onValueChange={(value) => {
          if (!value) {
            return;
          }

          onFilterUpdate(filter.id, {
            value: {
              ...filterValue,
              operator: value as FilterOperator,
              value: OPERATORS_WITHOUT_VALUE.has(value) ? undefined : "",
              endValue: undefined,
            },
          });
        }}
        value={filterValue.operator}
      >
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {operators.map((operator) => (
            <SelectItem key={operator.value} value={operator.value}>
              {operator.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {valueInput}

      <Button
        aria-label="Remove filter"
        onClick={() => onFilterRemove(filter.id)}
        size="icon-sm"
        variant="ghost"
      >
        <Trash2 className="size-4" />
      </Button>
    </div>
  );
}
