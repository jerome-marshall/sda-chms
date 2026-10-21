import { afterEach, describe, expect, it } from "vite-plus/test";

import seed from "../../src/db/seed";

const runSeed = (host?: unknown) =>
  seed({
    dialect: "postgresql",
    db: { $client: { host } },
    schema: {},
  } as never);

/**
 * `void db seed` wipes `public` before the seed callback runs, so the
 * callback's localhost guard is the last line of defense: it refuses the
 * insert phase on a non-local host (or when the host cannot be determined),
 * loudly, unless explicitly overridden.
 */
describe("seed localhost guard", () => {
  const allowRemote = process.env.SEED_ALLOW_REMOTE;

  afterEach(() => {
    if (allowRemote === undefined) {
      delete process.env.SEED_ALLOW_REMOTE;
    } else {
      process.env.SEED_ALLOW_REMOTE = allowRemote;
    }
  });

  it("refuses a non-local host before inserting anything", async () => {
    await expect(runSeed("example.invalid")).rejects.toThrow(
      /Refusing to seed non-local database host "example\.invalid"/u
    );
  });

  it("refuses when the host cannot be determined", async () => {
    await expect(runSeed()).rejects.toThrow(
      /Refusing to seed non-local database host/u
    );
  });

  it("lets an explicit override through the guard", async () => {
    process.env.SEED_ALLOW_REMOTE = "true";
    // Passes the guard, then fails on the stub db — which proves the guard
    // itself no longer blocks, without touching a real database.
    await expect(runSeed("example.invalid")).rejects.not.toThrow(
      /Refusing to seed non-local/u
    );
  });

  it("lets localhost through the guard", async () => {
    await expect(runSeed("localhost")).rejects.not.toThrow(
      /Refusing to seed non-local/u
    );
  });
});
