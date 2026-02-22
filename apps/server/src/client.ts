import { hc } from "hono/client";
import type { THonoApp } from "./index";

/** Pre-calculated Hono client type — imported by the web app for end-to-end type-safe API calls. */
export type Client = ReturnType<typeof hc<THonoApp>>;

export const hcWithType = (...args: Parameters<typeof hc>): Client =>
  hc<THonoApp>(...args);
