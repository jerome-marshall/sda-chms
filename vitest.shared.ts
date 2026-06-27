/**
 * Shared Vitest building blocks, imported by every per-package config so the
 * test-file glob and the workspace-source resolution rule live in one place
 * (the per-package configs still set their own `name`/`environment`/`env`).
 */

/** Match test files in any package. */
export const testInclude = ["src/**/*.test.{ts,tsx}"];

/**
 * Workspace packages resolve to TS source; inline them so Vite transforms them
 * instead of Node trying to import raw `.ts`.
 */
export const workspaceDeps = { inline: [/^@sda-chms\//] };
