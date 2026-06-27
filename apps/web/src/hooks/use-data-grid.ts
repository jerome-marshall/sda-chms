import {
  type ColumnFiltersState,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  type RowSelectionState,
  type SortingState,
  type TableOptions,
  type TableState,
  useReactTable,
  type VisibilityState,
} from "@tanstack/react-table";
import { useMemo, useState } from "react";
import type { RowHeightValue } from "@/types/data-grid";

interface UseDataGridProps<TData>
  extends Omit<
    TableOptions<TData>,
    "getCoreRowModel" | "getFilteredRowModel" | "getSortedRowModel" | "state"
  > {
  initialState?: Partial<TableState>;
}

export function useDataGrid<TData>(props: UseDataGridProps<TData>) {
  const { initialState, ...tableProps } = props;
  const [rowSelection, setRowSelection] = useState<RowSelectionState>(
    initialState?.rowSelection ?? {}
  );
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
    initialState?.columnVisibility ?? {}
  );
  const [sorting, setSorting] = useState<SortingState>(
    initialState?.sorting ?? []
  );
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>(
    initialState?.columnFilters ?? []
  );
  const [rowHeight, setRowHeight] = useState<RowHeightValue>("short");

  const table = useReactTable({
    ...tableProps,
    state: {
      rowSelection,
      columnVisibility,
      sorting,
      columnFilters,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onColumnVisibilityChange: setColumnVisibility,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    meta: {
      ...tableProps.meta,
      rowHeight,
      onRowHeightChange: setRowHeight,
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return useMemo(() => ({ table, rowHeight }), [rowHeight, table]);
}
