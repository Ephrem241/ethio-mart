import { defineConfig } from "vitest/config"
import tsconfigPaths from "vite-tsconfig-paths"

// Unit tests: the pure logic of the app (pricing, filtering, validation,
// translation, URL and SEO builders). No browser, no network, no database — those
// are covered by the end-to-end suite in ./e2e (see README, "Testing").
// async Server Components are not unit-testable (Vitest can't render them), so
// pages are left to the e2e tests too.
export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
})
