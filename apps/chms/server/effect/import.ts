import { Context, Effect, Layer } from "effect";

import type { ImportSummary } from "../../scripts/import-helpers";
import type { BatchWriteDatabase } from "../db";
import { importPeopleCsv as runImport } from "../import";
import { Db } from "./db";
import { InfraError, isImportLimitExceeded } from "./errors";
import type { ImportLimitExceeded } from "./errors";

export { MAX_CSV_CHARS } from "../import";

/**
 * Lifts the importer into Effect. The importer records per-household
 * failures in its summary; only a limit breach or an unexpected parse/DB
 * failure reaches the error channel. The limit keeps its typed tag through
 * the rejection, so the edge maps it to a 400 rather than an infrastructure
 * fault.
 */
const importCsv = (
  db: BatchWriteDatabase,
  csv: string
): Effect.Effect<ImportSummary, ImportLimitExceeded | InfraError> =>
  Effect.tryPromise({
    try: () => runImport(db, csv),
    catch: (cause) =>
      isImportLimitExceeded(cause) ? cause : new InfraError({ cause }),
  });

/** The CSV import operation the API exposes. */
export interface ImportService {
  readonly run: (
    csv: string
  ) => Effect.Effect<ImportSummary, ImportLimitExceeded | InfraError>;
}

/** The development CSV importer behind Effect. */
export class Import extends Context.Service<Import, ImportService>()(
  "Import"
) {}

/** Builds the Import service from the request-scoped database. */
export const ImportLive = Layer.effect(
  Import,
  Effect.gen(function* ImportLive() {
    const db = yield* Db;
    return {
      run: (csv) => importCsv(db, csv),
    };
  })
);

/** Imports the operator's member CSV, one batch per Household group. */
export const importPeopleCsv = (csv: string) =>
  Effect.gen(function* importPeopleProgram() {
    const importer = yield* Import;
    return yield* importer.run(csv);
  });
