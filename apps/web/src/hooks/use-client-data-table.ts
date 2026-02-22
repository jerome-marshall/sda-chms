import {
  type ColumnFiltersState,
  getCoreRowModel,
  getFacetedMinMaxValues,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type PaginationState,
  type RowSelectionState,
  type SortingState,
  type TableOptions,
  type TableState,
  useReactTable,
  type VisibilityState,
} from "@tanstack/react-table";
import { useMemo, useState } from "react";

interface UseClientDataTableProps<TData>
  extends Omit<
    TableOptions<TData>,
    | "state"
    | "getCoreRowModel"
    | "manualFiltering"
    | "manualPagination"
    | "manualSorting"
  > {
  initialState?: Partial<TableState>;
}

/** TanStack Table hook for client-side pagination, sorting, and filtering (all data loaded up-front). */
export function useClientDataTable<TData>(
  props: UseClientDataTableProps<TData>
) {
  const { columns, data, initialState, ...tableProps } = props;

  // Local state for all table features
  const [rowSelection, setRowSelection] = useState<RowSelectionState>(
    initialState?.rowSelection ?? {}
  );
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
    initialState?.columnVisibility ?? {}
  );
  const [pagination, setPagination] = useState<PaginationState>(
    initialState?.pagination ?? {
      pageIndex: 0,
      pageSize: 10,
    }
  );
  const [sorting, setSorting] = useState<SortingState>(
    initialState?.sorting ?? []
  );
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>(
    initialState?.columnFilters ?? []
  );

  const table = useReactTable({
    ...tableProps,
    data,
    columns,
    state: {
      pagination,
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
    },
    defaultColumn: {
      ...tableProps.defaultColumn,
      enableColumnFilter: false,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFacetedMinMaxValues: getFacetedMinMaxValues(),
    // Client-side operations - table handles everything
    manualPagination: false,
    manualSorting: false,
    manualFiltering: false,
  });

  return useMemo(() => ({ table }), [table]);
}
