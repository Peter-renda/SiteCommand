import { describe, it, expect } from "vitest";
import { resolvePermission } from "@/lib/permissions";

describe("resolvePermission", () => {
  it("prefers the explicit permission column", () => {
    expect(resolvePermission({ permission: "read_only", role: "member" })).toBe("read_only");
    expect(resolvePermission({ permission: "write", role: "external_viewer" })).toBe("write");
  });

  it("derives read_only for legacy external_viewer rows without a permission", () => {
    expect(resolvePermission({ role: "external_viewer" })).toBe("read_only");
    expect(resolvePermission({ permission: null, role: "external_viewer" })).toBe("read_only");
  });

  it("defaults to write for legacy non-external rows", () => {
    expect(resolvePermission({ role: "member" })).toBe("write");
    expect(resolvePermission({})).toBe("write");
  });
});
