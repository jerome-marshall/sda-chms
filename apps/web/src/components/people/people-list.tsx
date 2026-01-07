import { MEMBERSHIP_STATUS_OPTIONS } from "@sda-chms/shared/constants/people";
import type { ColumnDef } from "@tanstack/react-table";
import { Mail, Phone, Shield, User } from "lucide-react";
import { useMemo } from "react";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { useDataTable } from "@/hooks/use-data-table";

// Simple Person type for the table
interface Person {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  membershipStatus: string;
}

// Dummy data - 10 people
const dummyPeople: Person[] = [
  {
    id: "1",
    firstName: "John",
    lastName: "Smith",
    email: "john.smith@example.com",
    phone: "(555) 123-4567",
    membershipStatus: "member",
  },
  {
    id: "2",
    firstName: "Sarah",
    lastName: "Johnson",
    email: "sarah.johnson@example.com",
    phone: "(555) 234-5678",
    membershipStatus: "member",
  },
  {
    id: "3",
    firstName: "Michael",
    lastName: "Williams",
    email: "michael.williams@example.com",
    phone: "(555) 345-6789",
    membershipStatus: "regular_attendee",
  },
  {
    id: "4",
    firstName: "Emily",
    lastName: "Brown",
    email: "emily.brown@example.com",
    phone: "(555) 456-7890",
    membershipStatus: "visitor",
  },
  {
    id: "5",
    firstName: "David",
    lastName: "Jones",
    email: "david.jones@example.com",
    phone: "(555) 567-8901",
    membershipStatus: "member",
  },
  {
    id: "6",
    firstName: "Jessica",
    lastName: "Garcia",
    email: "jessica.garcia@example.com",
    phone: "(555) 678-9012",
    membershipStatus: "regular_attendee",
  },
  {
    id: "7",
    firstName: "Christopher",
    lastName: "Miller",
    email: "chris.miller@example.com",
    phone: "(555) 789-0123",
    membershipStatus: "member",
  },
  {
    id: "8",
    firstName: "Amanda",
    lastName: "Davis",
    email: "amanda.davis@example.com",
    phone: "(555) 890-1234",
    membershipStatus: "visitor",
  },
  {
    id: "9",
    firstName: "James",
    lastName: "Rodriguez",
    email: "james.rodriguez@example.com",
    phone: "(555) 901-2345",
    membershipStatus: "member",
  },
  {
    id: "10",
    firstName: "Lisa",
    lastName: "Martinez",
    email: "lisa.martinez@example.com",
    phone: "(555) 012-3456",
    membershipStatus: "regular_attendee",
  },
];

export const PeopleList = () => {
  const columns = useMemo<ColumnDef<Person>[]>(
    () => [
      {
        id: "firstName",
        accessorKey: "firstName",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label="First Name" />
        ),
        cell: ({ row }) => <div>{row.getValue("firstName")}</div>,
        enableSorting: true,
        meta: {
          label: "First Name",
          placeholder: "Search first names...",
          variant: "text",
          icon: User,
        },
        enableColumnFilter: true,
      },
      {
        id: "lastName",
        accessorKey: "lastName",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label="Last Name" />
        ),
        cell: ({ row }) => <div>{row.getValue("lastName")}</div>,
        enableSorting: true,
        meta: {
          label: "Last Name",
          placeholder: "Search last names...",
          variant: "text",
          icon: User,
        },
        enableColumnFilter: true,
      },
      {
        id: "email",
        accessorKey: "email",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label="Email" />
        ),
        cell: ({ row }) => <div>{row.getValue("email") || "—"}</div>,
        enableSorting: true,
        meta: {
          label: "Email",
          placeholder: "Search emails...",
          variant: "text",
          icon: Mail,
        },
        enableColumnFilter: true,
      },
      {
        id: "phone",
        accessorKey: "phone",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label="Phone" />
        ),
        cell: ({ row }) => <div>{row.getValue("phone")}</div>,
        enableSorting: true,
        meta: {
          label: "Phone",
          placeholder: "Search phone numbers...",
          variant: "text",
          icon: Phone,
        },
        enableColumnFilter: true,
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
          variant: "select",
          options: MEMBERSHIP_STATUS_OPTIONS,
          icon: Shield,
        },
        enableColumnFilter: true,
      },
    ],
    []
  );

  const { table } = useDataTable<Person>({
    data: dummyPeople,
    columns,
    initialState: {
      pagination: { pageIndex: 0, pageSize: 10 },
    },
    getRowId: (row) => row.id,
    pageCount: -1,
  });

  return (
    <DataTable table={table}>
      <DataTableToolbar table={table} />
    </DataTable>
  );
};

export default PeopleList;
