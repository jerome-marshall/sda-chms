import { MEMBERSHIP_STATUS_OPTIONS } from "@sda-chms/shared/constants/people";
import { Link } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { MapPin, Phone, Shield, User } from "lucide-react";
import { useMemo } from "react";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { DataTableSkeleton } from "@/components/data-table/data-table-skeleton";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { usePeople } from "@/hooks/data/use-people";
import { useClientDataTable } from "@/hooks/use-client-data-table";
import type { Person } from "@/types/api";
import { getInfoOrFromHousehold } from "@/utils/people";
import HouseholdTooltip from "../household-tooltip";

/** Main people list view — client-side data table with search, filter, and sort. */
export const PeopleList = () => {
  const { data: people, isLoading, isError } = usePeople();

  const columns = useMemo<ColumnDef<Person>[]>(
    () => [
      {
        id: "fullName",
        accessorKey: "fullName",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label="Full Name" />
        ),
        cell: ({ row }) => (
          <Link
            className="underline hover:no-underline"
            params={{ peopleId: row.original.id }}
            to="/people/$peopleId"
          >
            {row.getValue("fullName")}
          </Link>
        ),
        enableSorting: true,
        meta: {
          label: "Full Name",
          placeholder: "Search names...",
          variant: "text",
          icon: User,
        },
        enableColumnFilter: true,
      },
      {
        id: "phone",
        accessorKey: "phone",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label="Phone" />
        ),
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
        enableSorting: true,
        meta: {
          label: "Phone",
          placeholder: "Search phone numbers...",
          variant: "text",
          icon: Phone,
        },
      },
      {
        id: "city",
        accessorKey: "city",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label="City" />
        ),
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
        enableSorting: true,
        meta: {
          label: "City",
          placeholder: "Search cities...",
          variant: "text",
          icon: MapPin,
        },
      },
      {
        id: "membershipStatus",
        accessorKey: "membershipStatus",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label="Membership Status" />
        ),
        cell: ({ row }) => {
          const status = row.getValue("membershipStatus") as string;
          const option = MEMBERSHIP_STATUS_OPTIONS.find(
            (opt) => opt.value === status
          );
          return <div>{option?.label || status}</div>;
        },
        enableSorting: true,
        meta: {
          label: "Membership Status",
          variant: "multiSelect",
          options: MEMBERSHIP_STATUS_OPTIONS,
          icon: Shield,
        },
        enableColumnFilter: true,
      },
    ],
    []
  );

  const { table } = useClientDataTable<Person>({
    data: people || [],
    columns,
    initialState: {
      pagination: { pageIndex: 0, pageSize: 50 },
    },
    getRowId: (row: Person) => row.id,
  });

  if (isLoading) {
    return <DataTableSkeleton columnCount={5} rowCount={10} />;
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">Error loading people</p>
      </div>
    );
  }

  return (
    <DataTable table={table}>
      <DataTableToolbar table={table} />
    </DataTable>
  );
};

export default PeopleList;
