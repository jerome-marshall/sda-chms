export interface ApiErrorBody {
  code: "HTTP_ERROR" | "VALIDATION_ERROR" | "INTERNAL_ERROR" | "DB_ERROR";
  message: string;
  details?: unknown;
}
