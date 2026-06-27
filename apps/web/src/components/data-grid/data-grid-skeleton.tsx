import type * as React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface DataGridSkeletonProps extends React.ComponentProps<"div"> {
  columnCount: number;
  rowCount?: number;
}

export function DataGridSkeleton({
  columnCount,
  rowCount = 10,
  className,
  ...props
}: DataGridSkeletonProps) {
  return (
    <div className={cn("w-full rounded-md border", className)} {...props}>
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            {Array.from({ length: columnCount }, (_, index) => (
              <TableHead key={`header-${index.toString()}`}>
                <Skeleton className="h-5 w-full" />
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: rowCount }, (_, rowIndex) => (
            <TableRow
              className="hover:bg-transparent"
              key={`row-${rowIndex.toString()}`}
            >
              {Array.from({ length: columnCount }, (_, columnIndex) => (
                <TableCell
                  key={`cell-${rowIndex.toString()}-${columnIndex.toString()}`}
                >
                  <Skeleton className="h-5 w-full" />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
