import { Hono } from "hono";
import type { CloudContext } from "void/handler";
import { convertReturnValue } from "void/response";

/**
 * Mounts the real `routes/` files on a bare Hono app for tests — the same
 * shape Void's dispatcher builds in production: file path to URL pattern
 * (`index.ts` to its directory, `[id]` to `:id`, `[...path]` to `:path{.+}`),
 * routes registered most-specific-first (ported from Void's
 * `compareRouteSpecificity`), each exported HTTP method mounted, `middleware/`
 * applied in numeric order, and return values converted with Void's own
 * `convertReturnValue`.
 */

const HTTP_METHODS = [
  "GET",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
  "OPTIONS",
  "HEAD",
] as const;

interface RouteModule {
  filePath: string;
  pattern: string;
  catchAll: boolean;
}

const toPattern = (filePath: string): Omit<RouteModule, "filePath"> | null => {
  const withoutExtension = filePath.replace(/\.[^.]*$/u, "");
  const segments = withoutExtension.split("/");
  const file = segments.pop();
  if (file !== "index") {
    // A `.dev` or `.prod` suffix includes a route in only one environment
    // (Void docs, server routing). Tests run dev-like: `.dev` routes are
    // mounted under their stripped name, `.prod` routes are skipped.
    if (file?.endsWith(".prod")) {
      return null;
    }
    segments.push((file ?? "").replace(/\.dev$/u, ""));
  }
  let catchAll = false;
  const pattern = `/${segments
    .map((segment) => {
      const catchAllName = /^\[\.\.\.(?<name>.+)\]$/u.exec(segment)?.groups
        ?.name;
      if (catchAllName) {
        catchAll = true;
        return `:${catchAllName}{.+}`;
      }
      const paramName = /^\[(?<name>.+)\]$/u.exec(segment)?.groups?.name;
      if (paramName) {
        return `:${paramName}`;
      }
      return segment;
    })
    .join("/")}`;
  return { pattern, catchAll };
};

const isDynamicSegment = (segment: string | undefined): boolean =>
  (segment?.startsWith(":") ?? false) || segment === "*";

const compareRouteSpecificity = (
  a: Omit<RouteModule, "filePath">,
  b: Omit<RouteModule, "filePath">
): number => {
  if (a.catchAll !== b.catchAll) {
    return a.catchAll ? 1 : -1;
  }
  const aSegments = a.pattern.split("/");
  const bSegments = b.pattern.split("/");
  const shared = Math.min(aSegments.length, bSegments.length);
  for (let index = 0; index < shared; index += 1) {
    const aSegment = aSegments[index];
    const bSegment = bSegments[index];
    if (isDynamicSegment(aSegment) !== isDynamicSegment(bSegment)) {
      return isDynamicSegment(aSegment) ? 1 : -1;
    }
    if (aSegment !== bSegment) {
      return (aSegment ?? "").localeCompare(bSegment ?? "");
    }
  }
  return aSegments.length - bSegments.length;
};

/**
 * Void's middleware order, ported from its `parseMiddlewareDefinitions`:
 * files with a numeric `NN.` prefix run first in ascending numeric order,
 * files without one run last, and `_`-prefixed files are not middleware at
 * all. Exported so a unit test pins it — the helper cannot silently diverge
 * when a second middleware lands.
 */
const middlewareOrderOf = (filePath: string): number => {
  const file = filePath.split("/").pop() ?? "";
  if (file.startsWith("_")) {
    return Number.NaN;
  }
  const match = /^(?<order>\d+)\./u.exec(file);
  const order = match?.groups?.order;
  return order === undefined
    ? Number.POSITIVE_INFINITY
    : Number.parseInt(order, 10);
};

export const sortMiddlewareFiles = (filePaths: string[]): string[] =>
  filePaths
    .filter((filePath) => !Number.isNaN(middlewareOrderOf(filePath)))
    .toSorted((a, b) => middlewareOrderOf(a) - middlewareOrderOf(b));

/**
 * Builds a test app from the real route files. Void types handlers against
 * an extended context (`CloudContext` carries `rewrite`/`originalUrl` /
 * `isRewritten`), which a bare `new Hono()` does not provide — the helper
 * avoids the mismatch by invoking handlers through `Function`, which changes
 * nothing at runtime.
 */
export const createTestApp = (): Hono => {
  const app = new Hono();

  const middlewareModules: Record<string, { default?: unknown }> =
    import.meta.glob("../src/middleware/*.ts", {
      eager: true,
    });
  for (const filePath of sortMiddlewareFiles(Object.keys(middlewareModules))) {
    const middleware = middlewareModules[filePath]?.default;
    if (typeof middleware === "function") {
      app.use(async (c, next) => {
        await middleware(c, next);
      });
    }
  }

  const routeModules: Record<
    string,
    Record<string, unknown>
  > = import.meta.glob("../src/routes/**/*.ts", {
    eager: true,
  });
  const routes = Object.keys(routeModules)
    .filter((filePath) => !filePath.endsWith(".test.ts"))
    .flatMap((filePath): RouteModule[] => {
      const relativePath = filePath.replace(/^\.\.\/src\/routes\//u, "");
      const pattern = toPattern(relativePath);
      return pattern === null ? [] : [{ filePath, ...pattern }];
    })
    .toSorted(compareRouteSpecificity);

  for (const route of routes) {
    const routeModule = routeModules[route.filePath];
    if (!routeModule) {
      continue;
    }
    for (const method of HTTP_METHODS) {
      const handler = routeModule[method];
      if (typeof handler !== "function") {
        continue;
      }
      const routeHandler = handler as (c: CloudContext) => unknown;
      app.on(method, route.pattern, async (c) =>
        convertReturnValue(await routeHandler(c as unknown as CloudContext))
      );
    }
  }

  return app;
};
