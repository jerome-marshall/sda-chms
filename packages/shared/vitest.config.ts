import { defineConfig } from "vitest/config";
import { testInclude, workspaceDeps } from "../../vitest.shared";

export default defineConfig({
  test: {
    name: "shared",
    environment: "node",
    include: testInclude,
    server: { deps: workspaceDeps },
  },
});
