import { DrizzleError, DrizzleQueryError } from "drizzle-orm";
import { DatabaseError } from "pg";

// Defines the shape of the error handler functions
type ErrorHandler = (error: DatabaseError) => {
  message: string;
  constraint: string | null;
  httpCode: number;
};

// Maps PostgreSQL error codes to specific handler functions
const PostgresErrorHandlers: Record<string, ErrorHandler> = {
  // Unique violation - resource already exists
  "23505": (error) => ({
    message: "A duplicate entry was found for a unique field.",
    constraint: error.constraint || null,
    httpCode: 409, // Conflict
  }),
  // Foreign key violation - referenced resource doesn't exist
  "23503": (error) => ({
    message:
      "A foreign key violation occurred. The record you are trying to link does not exist.",
    constraint: error.constraint || null,
    httpCode: 422, // Unprocessable Content
  }),
  // Invalid text representation (e.g., invalid UUID)
  "22P02": () => ({
    message:
      "The data provided is in an invalid format (e.g., not a valid UUID).",
    constraint: null,
    httpCode: 400, // Bad Request
  }),
  // Check constraint violation
  "23514": (error) => ({
    message: "A check constraint was violated.",
    constraint: error.constraint || null,
    httpCode: 422, // Unprocessable Content
  }),
  // Not null violation
  "23502": (error) => ({
    message: `A required field is missing. The column '${error.column}' cannot be null.`,
    constraint: error.column || null,
    httpCode: 400, // Bad Request
  }),
  // Undefined column
  "42703": (error) => ({
    message: "An undefined column was referenced in the query.",
    constraint: error.column || null,
    httpCode: 500, // Internal Server Error
  }),
  // Syntax error
  "42601": () => ({
    message: "There's a syntax error in the database query.",
    constraint: null,
    httpCode: 500, // Internal Server Error
  }),
  // Invalid transaction state
  "25000": () => ({
    message:
      "Transaction failed: a data integrity issue occurred within a database transaction.",
    constraint: null,
    httpCode: 500, // Internal Server Error
  }),
  // Connection failure
  "08006": () => ({
    message: "Database connection failed. The database may be unavailable.",
    constraint: null,
    httpCode: 503, // Service Unavailable
  }),
  // Undefined table
  "42P01": () => ({
    message: "A referenced table does not exist in the database.",
    constraint: null,
    httpCode: 500, // Internal Server Error
  }),
  // Serialization failure
  "40001": () => ({
    message:
      "Transaction serialization failure. Please retry the transaction as it could not be completed due to concurrent modifications.",
    constraint: null,
    httpCode: 503, // Service Unavailable (retry-able)
  }),
  // Default handler
  default: (error) => ({
    message: `A database error occurred: ${error.message}`,
    constraint: null,
    httpCode: 500, // Internal Server Error
  }),
};

export interface DbErrorResult {
  message: string;
  constraint: string | null;
  httpCode: number;
}

/**
 * Extracts a user-friendly message, constraint, and HTTP status code from a Drizzle ORM error.
 * @param error The error object from Drizzle.
 * @returns An object with the main error message, constraint name (if applicable), and HTTP status code.
 */
export function getDbErrorMessage(error: unknown): DbErrorResult {
  if (
    error instanceof DrizzleQueryError &&
    error.cause instanceof DatabaseError
  ) {
    const originalError = error.cause;
    const handler = PostgresErrorHandlers[originalError.code ?? "default"];

    if (handler) {
      return handler(originalError);
    }

    // Default case for any other unhandled DatabaseError
    return {
      message: `A database error occurred: ${originalError.message}`,
      constraint: null,
      httpCode: 500,
    };
  }

  // Fallback for generic Drizzle errors or other Error instances
  if (error instanceof DrizzleError || error instanceof Error) {
    return {
      message: error.message || "An unexpected error occurred.",
      constraint: null,
      httpCode: 500,
    };
  }

  // Final fallback for unknown error types
  return {
    message: "An unknown error occurred.",
    constraint: null,
    httpCode: 500,
  };
}
