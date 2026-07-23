import { describe, it, expect } from "vitest";
import crypto from "crypto";
import { hashVerificationToken } from "@/lib/email-verification";

describe("hashVerificationToken", () => {
  it("is deterministic for the same input", () => {
    expect(hashVerificationToken("abc123")).toBe(hashVerificationToken("abc123"));
  });

  it("produces a 64-char sha256 hex digest", () => {
    const h = hashVerificationToken("some-token");
    expect(h).toMatch(/^[a-f0-9]{64}$/);
    // Matches a plain sha256 of the raw value (so the verify endpoint can match).
    expect(h).toBe(crypto.createHash("sha256").update("some-token").digest("hex"));
  });

  it("differs for different inputs (no collision on near-identical tokens)", () => {
    expect(hashVerificationToken("token-a")).not.toBe(hashVerificationToken("token-b"));
  });
});
