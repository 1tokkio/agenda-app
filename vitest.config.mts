import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const root = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@config": `${root}config`,
      "@": `${root}src`,
    },
  },
  test: {
    include: ["tests/**/*.test.ts"],
  },
});
