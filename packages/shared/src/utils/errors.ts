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
