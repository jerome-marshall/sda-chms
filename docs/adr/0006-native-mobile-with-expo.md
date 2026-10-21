---
status: accepted
---

# The mobile app is React Native on Expo

The church's phone app will be a native React Native app built with Expo. It is a second client of the existing JSON API and a second consumer of `packages/shared`. It is not part of the current program; no `apps/mobile` tree exists yet.

## Why

The operator wants a native feel, not a web page in a shell. Expo gives a managed React Native toolchain, native navigation, and a build path to both app stores without a second language or a second team. Keeping the app on the same TypeScript stack lets the Zod schemas, enum values, and domain helpers in `packages/shared` serve both clients.

## Considered options

- **A webview wrapper (Capacitor).** Rejected. It delivers web interactions and web scroll behavior on a phone, which is the problem the native app exists to solve.
- **A responsive PWA.** Rejected for the same reason. It also loses native APIs and store distribution.
- **React Native on Expo (chosen).** Native UI, shared TypeScript domain code, one API contract.

## Consequences

- The repo stays a pnpm workspace. `packages/shared` is the reason it does not flatten to one package, and the pnpm catalog stays because Expo pins React and the web app must match that pin.
- Shared code stays platform-free. No Node built-ins, DOM types, React types, or app aliases in `packages/shared`.
- The API under `/api/*` is the mobile contract. A change to a response shape is a change to both clients, so it goes through the shared Zod schema and the contract body.
- Authentication for the mobile client is not designed here. Void's Expo auth path is inferred, not proven, and belongs to the mobile program.
