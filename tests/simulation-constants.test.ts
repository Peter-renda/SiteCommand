import { describe, it, expect } from "vitest";
import {
  roleLabel,
  projectTypeLabel,
  trainingProjectName,
} from "@/lib/simulation-constants";

describe("label helpers", () => {
  it("roleLabel falls back to the raw value for an unknown role", () => {
    expect(roleLabel("not_a_real_role")).toBe("not_a_real_role");
  });

  it("projectTypeLabel falls back to the raw value for an unknown type", () => {
    expect(projectTypeLabel("not_a_type")).toBe("not_a_type");
  });
});

describe("trainingProjectName", () => {
  it("uses the bespoke project name for known types", () => {
    expect(trainingProjectName("healthcare")).toBe(
      "Nashville VA Medical Center - Bldg 626-700 Renovation",
    );
    expect(trainingProjectName("higher_ed")).toBe(
      "University of Washington - Kane Hall Update",
    );
  });

  it("falls back to a generic 'Training: <label>' for other types", () => {
    expect(trainingProjectName("some_unknown_type")).toBe("Training: some_unknown_type");
  });
});
