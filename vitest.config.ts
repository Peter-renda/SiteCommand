import { defineConfig } from "vitest/config";
import path from "path";

// Unit-test config for the pure/DB-free logic in lib/. Tests live in tests/ and
// run in a plain Node environment (no jsdom, no Supabase/Stripe env needed) so
// they stay fast and deterministic in CI. The `@/` alias mirrors tsconfig paths.
export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(__dirname) },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
});
