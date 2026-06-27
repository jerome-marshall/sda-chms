import type { Column, FilterFn, Row } from "@tanstack/react-table";
import type {
  BooleanFilterOperator,
  DateFilterOperator,
  FilterOperator,
  FilterValue,
  NumberFilterOperator,
  SelectFilterOperator,
  TextFilterOperator,
} from "@/types/data-grid";

export const TEXT_FILTER_OPERATORS: ReadonlyArray<{
  label: string;
  value: TextFilterOperator;
}> = [
  { label: "Contains", value: "contains" },
  { label: "Does not contain", value: "notContains" },
  { label: "Is", value: "equals" },
  { label: "Is not", value: "notEquals" },
  { label: "Starts with", value: "startsWith" },
  { label: "Ends with", value: "endsWith" },
  { label: "Is empty", value: "isEmpty" },
  { label: "Is not empty", value: "isNotEmpty" },
];

export const NUMBER_FILTER_OPERATORS: ReadonlyArray<{
  label: string;
  value: NumberFilterOperator;
}> = [
  { label: "Is", value: "equals" },
  { label: "Is not", value: "notEquals" },
  { label: "Is less than", value: "lessThan" },
  { label: "Is less than or equal to", value: "lessThanOrEqual" },
  { label: "Is greater than", value: "greaterThan" },
  { label: "Is greater than or equal to", value: "greaterThanOrEqual" },
  { label: "Is between", value: "isBetween" },
  { label: "Is empty", value: "isEmpty" },
  { label: "Is not empty", value: "isNotEmpty" },
];

export const DATE_FILTER_OPERATORS: ReadonlyArray<{
  label: string;
  value: DateFilterOperator;
}> = [
  { label: "Is", value: "equals" },
  { label: "Is not", value: "notEquals" },
  { label: "Is before", value: "before" },
  { label: "Is after", value: "after" },
  { label: "Is on or before", value: "onOrBefore" },
  { label: "Is on or after", value: "onOrAfter" },
  { label: "Is between", value: "isBetween" },
  { label: "Is empty", value: "isEmpty" },
  { label: "Is not empty", value: "isNotEmpty" },
];

export const SELECT_FILTER_OPERATORS: ReadonlyArray<{
  label: string;
  value: SelectFilterOperator;
}> = [
  { label: "Is", value: "is" },
  { label: "Is not", value: "isNot" },
  { label: "Is empty", value: "isEmpty" },
  { label: "Is not empty", value: "isNotEmpty" },
];

export const BOOLEAN_FILTER_OPERATORS: ReadonlyArray<{
  label: string;
  value: BooleanFilterOperator;
}> = [
  { label: "Is", value: "isTrue" },
  { label: "Is not", value: "isFalse" },
];

export function getDataGridColumnVariant<TData, TValue>(
  column: Column<TData, TValue>
) {
  return column.columnDef.meta?.cell?.variant ?? "short-text";
}

export function getDefaultOperator(variant: string): FilterOperator {
  switch (variant) {
    case "number":
      return "equals";
    case "date":
      return "equals";
    case "select":
    case "multi-select":
      return "is";
    case "checkbox":
      return "isTrue";
    default:
      return "contains";
  }
}

export function getOperatorsForVariant(variant: string): ReadonlyArray<{
  label: string;
  value: FilterOperator;
}> {
  switch (variant) {
    case "number":
      return NUMBER_FILTER_OPERATORS;
    case "date":
      return DATE_FILTER_OPERATORS;
    case "select":
    case "multi-select":
      return SELECT_FILTER_OPERATORS;
    case "checkbox":
      return BOOLEAN_FILTER_OPERATORS;
    default:
      return TEXT_FILTER_OPERATORS;
  }
}

function isEmptyCellValue(cellValue: unknown): boolean {
  return (
    cellValue === null ||
    cellValue === undefined ||
    cellValue === "" ||
    (Array.isArray(cellValue) && cellValue.length === 0)
  );
}

function matchPresenceOperator(
  operator: FilterOperator,
  cellValue: unknown
): boolean | null {
  switch (operator) {
    case "isEmpty":
      return isEmptyCellValue(cellValue);
    case "isNotEmpty":
      return !isEmptyCellValue(cellValue);
    case "isTrue":
      return cellValue === true;
    case "isFalse":
      return cellValue === false || !cellValue;
    default:
      return null;
  }
}

function matchEqualityOperator(
  operator: FilterOperator,
  cellValue: unknown,
  value: unknown
): boolean | null {
  if (operator === "is") {
    if (Array.isArray(cellValue)) {
      return cellValue.some((entry) => String(entry) === String(value));
    }
    return String(cellValue) === String(value);
  }
  if (operator === "isNot") {
    if (Array.isArray(cellValue)) {
      return !cellValue.some((entry) => String(entry) === String(value));
    }
    return String(cellValue) !== String(value);
  }
  return null;
}

function matchNumberOperator(
  operator: FilterOperator,
  cellValue: number,
  value: number,
  endValue: unknown
): boolean | null {
  switch (operator) {
    case "greaterThan":
      return cellValue > value;
    case "greaterThanOrEqual":
      return cellValue >= value;
    case "lessThan":
      return cellValue < value;
    case "lessThanOrEqual":
      return cellValue <= value;
    case "isBetween":
      return typeof endValue === "number"
        ? cellValue >= value && cellValue <= endValue
        : null;
    default:
      return null;
  }
}

function matchStringOperator(
  operator: FilterOperator,
  cellValueStr: string,
  filterValueStr: string
): boolean | null {
  switch (operator) {
    case "contains":
      return cellValueStr.includes(filterValueStr);
    case "notContains":
      return !cellValueStr.includes(filterValueStr);
    case "equals":
      return cellValueStr === filterValueStr;
    case "notEquals":
      return cellValueStr !== filterValueStr;
    case "startsWith":
      return cellValueStr.startsWith(filterValueStr);
    case "endsWith":
      return cellValueStr.endsWith(filterValueStr);
    default:
      return null;
  }
}

function isBlankFilterValue(value: unknown): boolean {
  return value === undefined || value === null || value === "";
}

function toComparableStrings(
  cellValue: unknown,
  value: unknown
): [string, string] {
  const cellValueStr = String(cellValue ?? "").toLowerCase();
  const filterValueStr =
    typeof value === "string" ? value.toLowerCase() : String(value);
  return [cellValueStr, filterValueStr];
}

export function getFilterFn<TData>(): FilterFn<TData> {
  return (row: Row<TData>, columnId: string, filterValue: unknown): boolean => {
    if (!filterValue || typeof filterValue !== "object") {
      return true;
    }

    const { operator, value, endValue } = filterValue as FilterValue;
    const cellValue = row.getValue(columnId);

    const presenceResult = matchPresenceOperator(operator, cellValue);
    if (presenceResult !== null) {
      return presenceResult;
    }

    if (isBlankFilterValue(value)) {
      return true;
    }

    const numberResult =
      typeof cellValue === "number" && typeof value === "number"
        ? matchNumberOperator(operator, cellValue, value, endValue)
        : null;
    const [cellValueStr, filterValueStr] = toComparableStrings(
      cellValue,
      value
    );

    const result =
      matchEqualityOperator(operator, cellValue, value) ??
      numberResult ??
      matchStringOperator(operator, cellValueStr, filterValueStr);

    return result ?? true;
  };
}
