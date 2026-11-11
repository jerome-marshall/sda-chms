# Frontend conventions

Read this before you change `apps/chms/src/pages` or `apps/chms/src/components`.

React 19 on Void pages, Tailwind CSS v4, and shadcn/ui.

## Routing

- `src/pages/` is the router. A file path becomes a URL: `people/index.tsx` renders `/people`, `people/add.tsx` renders `/people/add`, `people/[id]/index.tsx` renders `/people/:id`.
- `src/pages/layout.tsx` wraps every page with the shell, theme, breadcrumbs, and toaster.
- The server half sits beside the page as `<name>.server.ts` and exports `loader` and, when the page submits, `action`. Both use `defineHandler`.
- The page default export receives the loader result as props. Type them with `InferProps<typeof loader>` from the `.server` file.
- A loader reads through the API with `fetch` from `void/client`. It never imports a server module.
- An action calls the API and returns `c.redirect(...)` on success. On `FetchError`, forward the contract body so the form sees the same failure a direct API call would return.

## Data fetching

- `/api/*` is the only data contract.
- `fetch` from `void/client` is typed by the generated `RouteMap`, runs in-process during SSR, and forwards credentials.
- Pass route params through the typed `params` option: `fetch("/api/people/:id", { params: { id } })`. Do not build a URL string by hand.
- A client mutation calls `fetch`, then `router.refresh()` from `@void/react`.
- A form submission calls the page action with `action` from `@void/react`. The action redirects and the router renders the destination.
- `FetchError` carries the body in `data` and the status in `status`.

## Components

- Feature and page components use a default export. UI primitives use named exports.
- Props use an interface named `<Component>Props`.
- Types that describe an API payload live in `src/types/`. Types used by one component live beside it.

## Forms

- React Hook Form with `@hookform/resolvers/zod`.
- Schemas come from `@sda-chms/shared/schema/*`, the same ones the API validates with.
- Reusable fields live in `src/components/form/`.
- On success, show a toast with `sonner` and let the redirect or refresh update the page.
- On failure, read `FetchError.data` and show its message.

## Styling

- Tailwind utilities only. Use `cn()` from `@/lib/utils` to merge classes.
- shadcn/ui components live in `src/components/ui/`.
- Icons come from `lucide-react`.
- Theme switching uses `next-themes`.

## State

- Server data comes from page loaders. There is no client query cache.
- Form state uses React Hook Form.
- Local UI state uses `useState` in the component that owns it.
- No global store.

## Avoid

- A client router or a client query cache.
- Calling `window.fetch` for app data.
- Importing a server module into a page or component.
- CSS modules or styled-components.
- `forwardRef`. Pass refs as props.
- Boolean props that switch a component's layout. Compose instead.
