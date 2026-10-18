/**
 * Shared localhost guard for database seeding. `void db seed` wipes `public`
 * before the seed callback runs, so the check must happen in the entry point
 * that runs first — the in-callback guard in `db/seed.ts` is only the second
 * line of defense.
 */

/** Hosts that are always safe to wipe and reseed. */
const LOCAL_SEED_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

/** True for hosts that may be wiped and reseeded without an explicit override. */
export const isLocalSeedHost = (host: unknown): boolean =>
  typeof host === "string" && LOCAL_SEED_HOSTS.has(host);

/**
 * Refuses with the standard message unless the host is local or seeding a
 * remote was explicitly allowed. The entry-point script calls this before
 * Void ever connects; the seed callback calls it again as a second line.
 */
export const assertSeedableHost = (host: unknown): void => {
  if (!isLocalSeedHost(host) && process.env.SEED_ALLOW_REMOTE !== "true") {
    throw new Error(
      `Refusing to seed non-local database host "${typeof host === "string" ? host : "unknown"}". Seeding is for local development; set SEED_ALLOW_REMOTE=true to override.`
    );
  }
};
