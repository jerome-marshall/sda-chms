import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vite-plus/test";

// Unmount React trees and reset the DOM between tests.
afterEach(() => {
  cleanup();
});
