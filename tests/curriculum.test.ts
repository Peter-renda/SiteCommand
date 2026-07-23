import { describe, it, expect } from "vitest";
import { LESSONS, lessonsByTrack, TRACK_LABELS, type LessonTrack } from "@/lib/training-lessons";

// Guards the curriculum totals advertised on the marketing site (app/page.tsx):
// 121 lessons across the 9 construction-lifecycle tracks. If the curriculum
// changes, this fails so the homepage `tracks` counts get updated alongside it.
describe("curriculum totals (marketing claim guard)", () => {
  it("ships 121 lessons", () => {
    expect(LESSONS.length).toBe(121);
  });

  it("spans 9 distinct tracks", () => {
    const tracks = new Set(LESSONS.map((l) => l.track));
    expect(tracks.size).toBe(9);
    // Every track a lesson uses must be a known lifecycle track.
    for (const t of tracks) expect(t in TRACK_LABELS).toBe(true);
  });

  it("per-track counts match the marketing track index", () => {
    // Mirrors the `tracks` array on the homepage (app/page.tsx), keyed by the
    // real LessonTrack values.
    const expected: Record<LessonTrack, number> = {
      precon: 16,
      sitedev: 13,
      substructure: 5,
      superstructure: 8,
      "interior-mep": 17,
      finishes: 9,
      closeout: 5,
      foundations: 19,
      workflow: 29,
    };
    const sum = Object.values(expected).reduce((a, b) => a + b, 0);
    expect(sum).toBe(121);
    for (const [track, count] of Object.entries(expected)) {
      expect(lessonsByTrack(track as LessonTrack).length).toBe(count);
    }
  });

  it("every lesson has a unique id", () => {
    const ids = LESSONS.map((l) => l.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every product card links to ARCAT and has an icon", () => {
    const productLessons = LESSONS.filter((l) => l.products && l.products.length > 0);
    // The 9 per-trade "Common Products & Materials" lessons.
    expect(productLessons.length).toBe(9);
    for (const l of productLessons) {
      for (const p of l.products!) {
        expect(p.specUrl).toMatch(/^https:\/\/www\.arcat\.com\//);
        expect(p.icon.length).toBeGreaterThan(0);
        expect(p.name.length).toBeGreaterThan(0);
      }
    }
  });
});
