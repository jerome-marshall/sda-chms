import type { RowData } from "@tanstack/react-table";

export type RowHeightValue = "short" | "medium" | "tall" | "extra-tall";

export type TextFilterOperator =
  | "contains"
  | "notContains"
  | "equals"
  | "notEquals"
  | "startsWith"
  | "endsWith"
  | "isEmpty"
  | "isNotEmpty";

export type NumberFilterOperator =
  | "equals"
  | "notEquals"
  | "lessThan"
  | "lessThanOrEqual"
  | "greaterThan"
  | "greaterThanOrEqual"
  | "isBetween"
  | "isEmpty"
  | "isNotEmpty";

export type DateFilterOperator =
  | "equals"
  | "notEquals"
  | "before"
  | "after"
  | "onOrBefore"
  | "onOrAfter"
  | "isBetween"
  | "isEmpty"
  | "isNotEmpty";

export type SelectFilterOperator = "is" | "isNot" | "isEmpty" | "isNotEmpty";

export type BooleanFilterOperator = "isTrue" | "isFalse";

export type FilterOperator =
  | TextFilterOperator
  | NumberFilterOperator
  | DateFilterOperator
  | SelectFilterOperator
  | BooleanFilterOperator;

export interface FilterValue {
  operator: FilterOperator;
  value?: string | number | string[];
  endValue?: string | number;
}

declare module "@tanstack/react-table" {
  interface ColumnMeta<TData extends RowData, TValue> {
    cell?: {
      variant?:
        | "short-text"
        | "long-text"
        | "number"
        | "select"
        | "multi-select"
        | "checkbox"
        | "date"
        | "url";
    };
  }

  interface TableMeta<TData extends RowData> {
    rowHeight?: RowHeightValue;
    onRowHeightChange?: (value: RowHeightValue) => void;
  }
}
