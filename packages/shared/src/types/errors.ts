/** Standardized error shape returned by all API error responses. */
export interface ApiErrorBody {
  code: "HTTP_ERROR" | "VALIDATION_ERROR" | "INTERNAL_ERROR" | "DB_ERROR";
  /** The database constraint that failed, safe to expose (never SQL or bound values). */
  constraint?: string | null;
  details?: unknown;
  message: string;
}
