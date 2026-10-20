/**
 * The structural shape of a SQLite driver error. better-sqlite3 throws its
 * `SqliteError` (with `code` like `SQLITE_CONSTRAINT_UNIQUE`) unwrapped —
 * drizzle does not wrap sync-driver failures — while D1 surfaces failures
 * with the constraint text inside the message, so matching covers both the
 * `code` and the message.
 */
interface SqliteError {
  code?: string;
  message: string;
}

const SQLITE_CODE = (error: unknown): string | null =>
  error !== null &&
  typeof error === "object" &&
  "code" in error &&
  typeof (error as { code?: unknown }).code === "string"
    ? (error as { code: string }).code
    : null;

/** The `cause` of a wrapped error, when it has one (Drizzle/proxy wrappers). */
const errorCause = (error: unknown): unknown =>
  error !== null && typeof error === "object" && "cause" in error
    ? (error as { cause?: unknown }).cause
    : undefined;

/** Walks an error and its cause chain looking for a SQLite failure. */
const findSqliteError = (error: unknown): SqliteError | null => {
  let current: unknown = error;
  const seen = new Set<unknown>();
  while (current instanceof Error && !seen.has(current)) {
    seen.add(current);
    const code = SQLITE_CODE(current) ?? "";
    // A SQLite code, or D1-remote text carrying the constraint failure.
    if (
      code.startsWith("SQLITE_") ||
      /constraint failed/iu.test(current.message)
    ) {
      return current;
    }
    current = errorCause(current);
  }
  return null;
};

/**
 * True for Drizzle failures from any copy of drizzle-orm in the graph.
 * Neither `instanceof` nor the wrapper's `name` survives the split module
 * graph (dev and production bundle drizzle separately, and the worker
 * runtime can rewrap the failure in a plain Error) — but the `Drizzle`
 * name prefix and drizzle's fixed `Failed query:` message prefix do.
 */
export const isDrizzleErrorLike = (error: unknown): boolean =>
  error instanceof Error &&
  (error.name.startsWith("Drizzle") ||
    error.message.startsWith("Failed query:"));

/** Columns of the person-identity unique index (via the stored identity_* columns). */
const isIdentityConflict = (message: string): boolean =>
  /unique_person_identity/iu.test(message) ||
  (/people\.(?:first_name|identity_last_name|identity_date_of_birth)/iu.test(
    message
  ) &&
    /first_name/iu.test(message));

// Defines the shape of the error handler functions
type ErrorHandler = (message: string) => {
  message: string;
  constraint: string | null;
  httpCode: number;
};

// Maps SQLite failure kinds (by code, falling back to message text so D1
// remote errors without codes map the same way) to handler functions.
const SqliteErrorHandlers: {
  test: (code: string, message: string) => boolean;
  handle: ErrorHandler;
}[] = [
  {
    test: (code, message) =>
      code === "SQLITE_CONSTRAINT_UNIQUE" ||
      (/UNIQUE constraint failed/iu.test(message) &&
        !code.startsWith("SQLITE_")),
    handle: (message) => ({
      message: isIdentityConflict(message)
        ? "This person may already exist — someone with the same name and date of birth is already recorded."
        : "A duplicate entry was found for a unique field.",
      constraint: isIdentityConflict(message)
        ? "unique_person_identity"
        : (/UNIQUE constraint failed:\s*(?<column>[\w.]+)/iu.exec(message)
            ?.groups?.column ?? null),
      httpCode: 409, // Conflict
    }),
  },
  {
    test: (code, message) =>
      code === "SQLITE_CONSTRAINT_FOREIGNKEY" ||
      (/FOREIGN KEY constraint failed/iu.test(message) &&
        !code.startsWith("SQLITE_")),
    handle: () => ({
      message:
        "A foreign key violation occurred. The record you are trying to link does not exist.",
      constraint: null,
      httpCode: 422, // Unprocessable Content
    }),
  },
  {
    test: (code, message) =>
      code === "SQLITE_CONSTRAINT_NOTNULL" ||
      (/NOT NULL constraint failed/iu.test(message) &&
        !code.startsWith("SQLITE_")),
    handle: (message) => ({
      message: `A required field is missing. The column '${/NOT NULL constraint failed:\s*(?<column>[\w.]+)/iu.exec(message)?.groups?.column ?? "unknown"}' cannot be null.`,
      constraint:
        /NOT NULL constraint failed:\s*(?<column>[\w.]+)/iu.exec(message)
          ?.groups?.column ?? null,
      httpCode: 400, // Bad Request
    }),
  },
  {
    test: (code, message) =>
      code === "SQLITE_CONSTRAINT_CHECK" ||
      (/CHECK constraint failed/iu.test(message) &&
        !code.startsWith("SQLITE_")),
    handle: () => ({
      message: "A check constraint was violated.",
      constraint: null,
      httpCode: 422, // Unprocessable Content
    }),
  },
];

export interface DbErrorResult {
  constraint: string | null;
  httpCode: number;
  message: string;
}

/**
 * Maps a recognized SQLite/D1 constraint failure to its user-facing result,
 * or null when the error is not one. The error middleware uses this to turn
 * raw driver failures into the DB_ERROR contract in one place, so server
 * code never catches database errors itself. Unrecognized failures fall
 * through to the generic 500 path, never to a DB_ERROR guess.
 */
export function getDbConstraintViolation(error: unknown): DbErrorResult | null {
  const sqliteError = findSqliteError(error);
  if (!sqliteError) {
    return null;
  }
  const code = SQLITE_CODE(sqliteError) ?? "";
  const message = sqliteError.message;
  for (const { test, handle } of SqliteErrorHandlers) {
    if (test(code, message)) {
      return handle(message);
    }
  }
  return null;
}

/**
 * Extracts a user-friendly message, constraint, and HTTP status code from a
 * SQLite/D1 error. Matches on the driver's `code` first, then on the
 * constraint text in the message (D1 remote failures may lack codes).
 */
export function getDbErrorMessage(error: unknown): DbErrorResult {
  // Match on the SQLite failure itself, unwrapping any Drizzle/proxy wrapper
  // first: the wrapper's class identity (and even its `name`) does not
  // survive the split dev/prod module graphs, but the driver failure keeps
  // its `code` and message in every environment.
  const violation = getDbConstraintViolation(error);
  if (violation) {
    return violation;
  }

  const sqliteError = findSqliteError(error);
  if (sqliteError) {
    // Default case for any other SQLite failure.
    return {
      message: `A database error occurred: ${sqliteError.message}`,
      constraint: null,
      httpCode: 500,
    };
  }

  // Fallback for generic Drizzle errors or other Error instances. A Drizzle
  // failure always carries the raw SQL statement in its message, so it must
  // never reach the response body — the real error stays in the server log.
  if (error instanceof Error) {
    return {
      message: isDrizzleErrorLike(error)
        ? "An unexpected database error occurred."
        : (error.message ?? "An unexpected error occurred."),
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
