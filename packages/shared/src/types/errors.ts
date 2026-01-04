export interface ApiErrorBody {
  code: "HTTP_ERROR" | "VALIDATION_ERROR" | "INTERNAL_ERROR";
  message: string;
  details?: unknown;
}
