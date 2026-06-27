import { MEMBERSHIP_STATUS_OPTIONS } from "@sda-chms/shared/constants/people";
import { Link } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { useMemo } from "react";
import { DataGrid } from "@/components/data-grid/data-grid";
import { DataGridFilterMenu } from "@/components/data-grid/data-grid-filter-menu";
import { DataGridRowHeightMenu } from "@/components/data-grid/data-grid-row-height-menu";
import { getDataGridSelectColumn } from "@/components/data-grid/data-grid-select-column";
import { DataGridSkeleton } from "@/components/data-grid/data-grid-skeleton";
import { DataGridSortMenu } from "@/components/data-grid/data-grid-sort-menu";
import { DataGridViewMenu } from "@/components/data-grid/data-grid-view-menu";
import { usePeople } from "@/hooks/data/use-people";
import { useDataGrid } from "@/hooks/use-data-grid";
import { getFilterFn } from "@/lib/data-grid-filters";
import type { Person } from "@/types/api";
import { getInfoOrFromHousehold } from "@/utils/people";
import HouseholdTooltip from "../household-tooltip";

/** Main people list view rendered as a read-only data grid. */
export const PeopleList = () => {
  const { data: people, isLoading, isError } = usePeople();
  const filterFn = useMemo(() => getFilterFn<Person>(), []);

  const columns = useMemo<ColumnDef<Person>[]>(
    () => [
      getDataGridSelectColumn<Person>(),
      {
        id: "fullName",
        accessorKey: "fullName",
        header: "Name",
        cell: ({ row }) => (
          <Link
            className="underline hover:no-underline"
            params={{ peopleId: row.original.id }}
            to="/people/$peopleId"
          >
            {row.getValue("fullName")}
          </Link>
        ),
        filterFn,
        meta: {
          label: "Name",
          cell: {
            variant: "short-text",
          },
        },
      },
      {
        id: "phone",
        accessorFn: (person) =>
          getInfoOrFromHousehold(person, "phone").data ?? "",
        header: "Phone",
        cell: ({ row }) => {
          const person = row.original;
          const { data: phone, isfromHousehold } = getInfoOrFromHousehold(
            person,
            "phone"
          );

          return (
            <div className="flex items-center gap-1">
              <span>{phone || "-"}</span>
              <HouseholdTooltip isFromHousehold={isfromHousehold} />
            </div>
          );
        },
        filterFn,
        meta: {
          label: "Phone",
          cell: {
            variant: "short-text",
          },
        },
      },
      {
        id: "city",
        accessorFn: (person) =>
          getInfoOrFromHousehold(person, "city").data ?? "",
        header: "City",
        cell: ({ row }) => {
          const person = row.original;
          const { data: city, isfromHousehold } = getInfoOrFromHousehold(
            person,
            "city"
          );

          return (
            <div className="flex items-center gap-1">
              <span>{city || "-"}</span>
              <HouseholdTooltip isFromHousehold={isfromHousehold} />
            </div>
          );
        },
        filterFn,
        meta: {
          label: "City",
          cell: {
            variant: "short-text",
          },
        },
      },
      {
        id: "membershipStatus",
        accessorKey: "membershipStatus",
        header: "Membership Status",
        cell: ({ row }) => {
          const status = row.getValue("membershipStatus") as string;
          const option = MEMBERSHIP_STATUS_OPTIONS.find(
            (opt) => opt.value === status
          );
          return <div>{option?.label || status}</div>;
        },
        filterFn,
        meta: {
          label: "Membership Status",
          options: MEMBERSHIP_STATUS_OPTIONS,
          cell: {
            variant: "select",
          },
        },
      },
    ],
    [filterFn]
  );

  const { table } = useDataGrid<Person>({
    data: people || [],
    columns,
    getRowId: (row: Person) => row.id,
  });

  if (isLoading) {
    return <DataGridSkeleton columnCount={5} rowCount={10} />;
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">Error loading people</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div
        aria-orientation="horizontal"
        className="flex items-center justify-end gap-2"
        role="toolbar"
      >
        <DataGridFilterMenu align="end" table={table} />
        <DataGridSortMenu align="end" table={table} />
        <DataGridRowHeightMenu align="end" table={table} />
        <DataGridViewMenu align="end" table={table} />
      </div>
      <DataGrid height={640} table={table} />
    </div>
  );
};

export default PeopleList;
