import { describe, expect, it } from "vite-plus/test";

import { sortMiddlewareFiles } from "./routes";

describe(sortMiddlewareFiles, () => {
  it("runs numeric prefixes first in ascending numeric order", () => {
    expect(
      sortMiddlewareFiles([
        "../middleware/10.last.ts",
        "../middleware/02.second.ts",
        "../middleware/01.api-errors.ts",
      ])
    ).toStrictEqual([
      "../middleware/01.api-errors.ts",
      "../middleware/02.second.ts",
      "../middleware/10.last.ts",
    ]);
  });

  it("runs unprefixed files last", () => {
    expect(
      sortMiddlewareFiles([
        "../middleware/zebra.ts",
        "../middleware/01.api-errors.ts",
        "../middleware/auth.ts",
      ])
    ).toStrictEqual([
      "../middleware/01.api-errors.ts",
      "../middleware/zebra.ts",
      "../middleware/auth.ts",
    ]);
  });

  it("ignores underscore-prefixed files like Void does", () => {
    expect(
      sortMiddlewareFiles([
        "../middleware/_helper.ts",
        "../middleware/01.api-errors.ts",
      ])
    ).toStrictEqual(["../middleware/01.api-errors.ts"]);
  });
});
