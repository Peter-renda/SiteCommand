import { describe, it, expect } from "vitest";
import { LESSONS, lessonsByTrack } from "@/lib/training-lessons";

// Guards the curriculum totals advertised on the marketing site (app/page.tsx):
// 92 lessons across 9 tracks. If the curriculum changes, this fails so the
// homepage numbers get updated alongside it.
describe("curriculum totals (marketing claim guard)", () => {
  it("ships 92 lessons", () => {
    expect(LESSONS.length).toBe(92);
  });

  it("spans 9 distinct tracks", () => {
    const tracks = new Set(LESSONS.map((l) => l.track));
    expect(tracks.size).toBe(9);
  });

  it("per-track counts match the marketing track index", () => {
    // Mirrors the `tracks` array on the homepage.
    const expected: Record<string, number> = {
      workflow: 14,
      concept: 10,
      management: 13,
      technical: 11,
      sitework: 12,
      mep: 11,
      commercial: 6,
      foundations: 6,
      fieldops: 9,
    };
    const sum = Object.values(expected).reduce((a, b) => a + b, 0);
    expect(sum).toBe(92);
    for (const [track, count] of Object.entries(expected)) {
      expect(lessonsByTrack(track as never).length).toBe(count);
    }
  });

  it("every lesson has a unique id", () => {
    const ids = LESSONS.map((l) => l.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
