---
status: accepted
---

# Void pages render the app, and the API is the only data contract

Pages live in `apps/chms/src/pages/` and are served by Void. The JSON API in `src/routes/api/**` is the single contract for page data and, later, the mobile app. A page never reads the database or imports a server module; its loader and action call the API with `fetch` from `void/client`.

## Why

The app used to be a TanStack Router SPA that fetched JSON into a client query cache. The cache's optimistic-update reason did not exist in the code: there was no `onMutate` and no `setQueryData`. The router therefore owned a tree of client routes and a cache that only mirrored the server.

With Void pages, the file path is the route and the loader is the data load. A page's `.server.ts` half reads through the API during SSR, and `fetch` from `void/client` runs in-process, so there is no HTTP hop on the server. The browser hydrates the same page. Form submissions go to an action, which redirects to the destination page.

The API stays the contract because the operator chose a native Expo app as a second client. If loaders called domain modules directly, web and mobile would have two ways to read the same data and could drift. The spike paid for that lesson: loader types drifted from the API types. One contract, called from both clients, keeps them aligned.

## Considered options

- **Keep TanStack Router and TanStack Query.** Rejected. The client cache and the URL-state library existed for an optimistic interaction the app never built.
- **Let loaders call server modules directly.** Rejected. It forks the contract and caused the spike's type drift.
- **A separate API service.** Rejected. It adds a deployment and a network hop to an app whose pages and API already share one worker.
- **Void pages with the API as the contract (chosen).** Colocated `page.tsx` and `page.server.ts`, one origin, one contract.

## Consequences

- `void.config.ts` sets `sourceDir: "src"`, so `pages/`, `routes/`, `db/`, `middleware/`, and `env.ts` sit under `src/`.
- A page's server half exports `loader` and, when the page submits, `action`, both built with `defineHandler`. The default export receives `InferProps<typeof loader>`.
- A successful action returns `c.redirect(...)`, which the router turns into a 302. A failed action forwards the `FetchError` body so the form sees the API's `ApiErrorBody`.
- Client mutations call `fetch` from `void/client`, then `router.refresh()` from `@void/react` to reload loader data. There is no client query cache and no query-key registry.
- The error contract stays `ApiErrorBody`. `src/middleware/01.api-errors.ts` maps application errors and rewrites Void's validator responses, so the API's failures look the same to a page action and to a mobile client.
- Security headers set through `routing.headers` compile into Void's worker middleware. They apply to page and API responses in dev and in the production build.
- Pages render their own document, so `head` in `void.config.ts` owns the title and favicon that `index.html` used to supply.
