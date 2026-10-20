import { defineEnv } from "void/env";

// D1 needs no connection string: Void provisions the local binding itself,
// so there are no required server variables.
export default defineEnv({});
