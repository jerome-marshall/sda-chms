"use client";

import type { Table } from "@tanstack/react-table";
import {
  AlignVerticalSpaceAroundIcon,
  ChevronsDownUpIcon,
  EqualIcon,
  MinusIcon,
} from "lucide-react";
import { useMemo } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { RowHeightValue } from "@/types/data-grid";

const rowHeights = [
  { label: "Short", value: "short" as const, icon: MinusIcon },
  { label: "Medium", value: "medium" as const, icon: EqualIcon },
  { label: "Tall", value: "tall" as const, icon: AlignVerticalSpaceAroundIcon },
  {
    label: "Extra Tall",
    value: "extra-tall" as const,
    icon: ChevronsDownUpIcon,
  },
];

interface DataGridRowHeightMenuProps<TData>
  extends React.ComponentProps<typeof SelectContent> {
  table: Table<TData>;
  disabled?: boolean;
}

export function DataGridRowHeightMenu<TData>({
  table,
  disabled,
  ...props
}: DataGridRowHeightMenuProps<TData>) {
  const rowHeight = table.options.meta?.rowHeight ?? "short";
  const onRowHeightChange = table.options.meta?.onRowHeightChange;

  const selectedRowHeight = useMemo(
    () =>
      rowHeights.find((option) => option.value === rowHeight) ?? rowHeights[0],
    [rowHeight]
  );

  return (
    <Select
      disabled={disabled}
      onValueChange={(value) => onRowHeightChange?.(value as RowHeightValue)}
      value={rowHeight}
    >
      <SelectTrigger className="[&_svg:nth-child(2)]:hidden" size="sm">
        <SelectValue placeholder="Row height">
          <selectedRowHeight.icon />
          {selectedRowHeight.label}
        </SelectValue>
      </SelectTrigger>
      <SelectContent {...props}>
        {rowHeights.map((option) => {
          const OptionIcon = option.icon;

          return (
            <SelectItem key={option.value} value={option.value}>
              <OptionIcon className="size-4" />
              {option.label}
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
