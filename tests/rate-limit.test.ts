import { describe, it, expect } from "vitest";
import { checkRateLimit, clientIpFrom } from "@/lib/rate-limit";

describe("checkRateLimit", () => {
  it("allows up to the limit, then throttles within the window", () => {
    const key = `test-${Math.random()}`;
    // limit 3 per long window
    expect(checkRateLimit(key, 3, 60_000)).toBe(true);
    expect(checkRateLimit(key, 3, 60_000)).toBe(true);
    expect(checkRateLimit(key, 3, 60_000)).toBe(true);
    expect(checkRateLimit(key, 3, 60_000)).toBe(false);
  });

  it("resets after the window elapses", () => {
    const key = `test-${Math.random()}`;
    const windowMs = 50;
    // Both calls are synchronous and land well within the 50ms window.
    expect(checkRateLimit(key, 1, windowMs)).toBe(true);
    expect(checkRateLimit(key, 1, windowMs)).toBe(false);
    // After the window elapses, the budget resets.
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        expect(checkRateLimit(key, 1, windowMs)).toBe(true);
        resolve();
      }, windowMs + 20);
    });
  });

  it("keys are independent", () => {
    const a = `a-${Math.random()}`;
    const b = `b-${Math.random()}`;
    expect(checkRateLimit(a, 1, 60_000)).toBe(true);
    expect(checkRateLimit(a, 1, 60_000)).toBe(false);
    // A different key still has its own budget.
    expect(checkRateLimit(b, 1, 60_000)).toBe(true);
  });
});

describe("clientIpFrom", () => {
  it("uses the first x-forwarded-for entry", () => {
    const h = new Headers({ "x-forwarded-for": "1.2.3.4, 5.6.7.8" });
    expect(clientIpFrom(h)).toBe("1.2.3.4");
  });

  it("falls back to x-real-ip, then 'unknown'", () => {
    expect(clientIpFrom(new Headers({ "x-real-ip": "9.9.9.9" }))).toBe("9.9.9.9");
    expect(clientIpFrom(new Headers())).toBe("unknown");
  });
});
