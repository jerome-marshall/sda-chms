import { hc } from "hono/client";
import type { THonoApp } from "./index";

// Pre-calculate the client type at compile time
export type Client = ReturnType<typeof hc<THonoApp>>;

export const hcWithType = (...args: Parameters<typeof hc>): Client =>
  hc<THonoApp>(...args);
