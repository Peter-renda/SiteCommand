import { describe, it, expect } from "vitest";
import {
  getTrainingSchedule,
  clampTrainingDay,
  getScheduledDay,
  firstScheduledDay,
  lastScheduledDay,
} from "@/lib/training-schedule";

const pm = getTrainingSchedule("project_manager");

describe("PM training schedule", () => {
  it("runs from day 1 to day 77 (matches the marketing copy)", () => {
    expect(firstScheduledDay(pm)).toBe(1);
    expect(lastScheduledDay(pm)).toBe(77);
  });

  it("is ordered by ascending day", () => {
    for (let i = 1; i < pm.length; i++) {
      expect(pm[i].day).toBeGreaterThan(pm[i - 1].day);
    }
  });
});

describe("clampTrainingDay", () => {
  it("pins a fresh (0) or below-range day to the first scheduled day", () => {
    expect(clampTrainingDay(pm, 0)).toBe(1);
    expect(clampTrainingDay(pm, -5)).toBe(1);
  });

  it("never advances past the last scheduled day", () => {
    expect(clampTrainingDay(pm, 999)).toBe(77);
  });

  it("passes through an in-range day unchanged", () => {
    expect(clampTrainingDay(pm, 14)).toBe(14);
  });

  it("returns 0 for an empty schedule", () => {
    expect(clampTrainingDay([], 5)).toBe(0);
  });
});

describe("getScheduledDay", () => {
  it("returns the batch on an exact scheduled day and null between batches", () => {
    expect(getScheduledDay(pm, 1)).not.toBeNull();
    // Day 8 falls between the day-7 and day-10 batches (no tasks scheduled).
    expect(getScheduledDay(pm, 8)).toBeNull();
  });
});
