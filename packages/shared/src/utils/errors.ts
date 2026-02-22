/** Application-level error thrown by the data-access layer after translating raw DB errors. */
export class DbError extends Error {
  constraint: string | null;
  httpCode: number;

  constructor(message: string, constraint: string | null, httpCode: number) {
    super(message);
    this.name = "DbError";
    this.constraint = constraint;
    this.httpCode = httpCode;
  }
}
