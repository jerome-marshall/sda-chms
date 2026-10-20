import { MEMBERSHIP_STATUS_OPTIONS } from "@sda-chms/shared/constants/people";
import type { CellContext, ColumnDef } from "@tanstack/react-table";
import { Link } from "@void/react";
import { useMemo } from "react";

import { DataGrid } from "@/components/data-grid/data-grid";
import { DataGridFilterMenu } from "@/components/data-grid/data-grid-filter-menu";
import { DataGridRowHeightMenu } from "@/components/data-grid/data-grid-row-height-menu";
import { getDataGridSelectColumn } from "@/components/data-grid/data-grid-select-column";
import { DataGridSkeleton } from "@/components/data-grid/data-grid-skeleton";
import { DataGridSortMenu } from "@/components/data-grid/data-grid-sort-menu";
import { DataGridViewMenu } from "@/components/data-grid/data-grid-view-menu";
import { useDataGrid } from "@/hooks/use-data-grid";
import { getFilterFn } from "@/lib/data-grid-filters";
import type { People, Person } from "@/types/api";
import { getInfoOrFromHousehold } from "@/utils/people";

import HouseholdTooltip from "../household-tooltip";

function FullNameCell({ row }: CellContext<Person, unknown>) {
  return (
    <Link
      className="underline hover:no-underline"
      href={`/people/${row.original.id}`}
    >
      {row.getValue<string>("fullName")}
    </Link>
  );
}

function HouseholdInfoCell({
  person,
  field,
}: {
  person: Person;
  field: "phone" | "city";
}) {
  const { data, isfromHousehold } = getInfoOrFromHousehold(person, field);

  return (
    <div className="flex items-center gap-1">
      <span>{data || "-"}</span>
      <HouseholdTooltip isFromHousehold={isfromHousehold} />
    </div>
  );
}

function PhoneCell({ row }: CellContext<Person, unknown>) {
  return <HouseholdInfoCell field="phone" person={row.original} />;
}

function CityCell({ row }: CellContext<Person, unknown>) {
  return <HouseholdInfoCell field="city" person={row.original} />;
}

function MembershipStatusCell({ row }: CellContext<Person, unknown>) {
  const status = row.getValue<string>("membershipStatus");
  const option = MEMBERSHIP_STATUS_OPTIONS.find((opt) => opt.value === status);

  return <div>{option?.label ?? status}</div>;
}

/** Main people list view rendered as a read-only data grid. */
export const PeopleList = ({
  people,
  isLoading = false,
  isError = false,
}: {
  people: People;
  isLoading?: boolean;
  isError?: boolean;
}) => {
  const filterFn = useMemo(() => getFilterFn<Person>(), []);

  const columns = useMemo<ColumnDef<Person>[]>(
    () => [
      getDataGridSelectColumn<Person>(),
      {
        id: "fullName",
        accessorKey: "fullName",
        header: "Name",
        cell: FullNameCell,
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
        cell: PhoneCell,
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
        cell: CityCell,
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
        cell: MembershipStatusCell,
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
