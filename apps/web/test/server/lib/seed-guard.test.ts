import { afterEach, describe, expect, it } from "vite-plus/test";

import {
  assertSeedableHost,
  isLocalSeedHost,
} from "../../../server/lib/seed-guard";

describe("seed host guard", () => {
  const allowRemote = process.env.SEED_ALLOW_REMOTE;

  afterEach(() => {
    if (allowRemote === undefined) {
      delete process.env.SEED_ALLOW_REMOTE;
    } else {
      process.env.SEED_ALLOW_REMOTE = allowRemote;
    }
  });

  it.each(["localhost", "127.0.0.1", "::1"])("treats %s as local", (host) => {
    expect(isLocalSeedHost(host)).toBe(true);
    expect(() => assertSeedableHost(host)).not.toThrow();
  });

  it.each(["example.invalid", "10.0.0.1", "postgres", undefined, null, 42])(
    "refuses %s without an override",
    (host) => {
      expect(isLocalSeedHost(host)).toBe(false);
      expect(() => assertSeedableHost(host)).toThrow(/Refusing to seed/u);
    }
  );

  it("lets SEED_ALLOW_REMOTE=true through anywhere", () => {
    process.env.SEED_ALLOW_REMOTE = "true";
    expect(() => assertSeedableHost("example.invalid")).not.toThrow();
  });
});
