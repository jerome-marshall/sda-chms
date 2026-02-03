import { env } from "@sda-chms/env/server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { errorHandler } from "./lib/errors";
import groupsRoutes from "./routes/groups";
import householdRoutes from "./routes/household";
import peopleRoutes from "./routes/people";

const app = new Hono();

app.onError(errorHandler);

app.use(logger());
app.use(
  "/*",
  cors({
    origin: env.CORS_ORIGIN,
    allowMethods: ["GET", "POST", "OPTIONS"],
  })
);

const routes = app
  .get("/", (c) => {
    return c.text("OK");
  })
  .route("/people", peopleRoutes)
  .route("/groups", groupsRoutes)
  .route("/households", householdRoutes);

export default app;
export type THonoApp = typeof routes;
