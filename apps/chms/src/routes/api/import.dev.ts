import { defineHandler } from "void/handler";
import { z } from "zod";

import { importPeopleCsv, MAX_CSV_CHARS } from "../../../server/import";

/**
 * Development-only CSV import (the `.dev` suffix keeps it out of builds and
 * deploys). The thin `scripts/import-people.ts` client reads the file and
 * POSTs it here as `{ csv }`.
 */
export const POST = defineHandler.withValidator({
  body: z.object({ csv: z.string().min(1).max(MAX_CSV_CHARS) }),
})((_c, { body }) => importPeopleCsv(body.csv));
