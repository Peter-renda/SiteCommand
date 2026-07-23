import { describe, it, expect } from "vitest";
import {
  companyRoleDefaultLevel,
  templateNameToCategoryAndType,
  isPermissionLevel,
  isTemplateCategory,
  isTemplateUserType,
} from "@/lib/permission-templates";

describe("companyRoleDefaultLevel", () => {
  it("maps company roles to their default tool level", () => {
    expect(companyRoleDefaultLevel("super_admin")).toBe("admin");
    expect(companyRoleDefaultLevel("admin")).toBe("admin");
    expect(companyRoleDefaultLevel("member")).toBe("standard");
  });

  it("falls back to standard for unknown/blank roles", () => {
    expect(companyRoleDefaultLevel(null)).toBe("standard");
    expect(companyRoleDefaultLevel(undefined)).toBe("standard");
    expect(companyRoleDefaultLevel("nonsense")).toBe("standard");
  });
});

describe("templateNameToCategoryAndType", () => {
  it("maps external invitee template names to (category, userType)", () => {
    expect(templateNameToCategoryAndType("Subcontractor")).toEqual({
      category: "invitee",
      userType: "subcontractor",
    });
    expect(templateNameToCategoryAndType("Architect/Engineer")).toEqual({
      category: "invitee",
      userType: "architect_engineer",
    });
    expect(templateNameToCategoryAndType("Owner/Client")).toEqual({
      category: "invitee",
      userType: "owner_client",
    });
  });

  it("returns null for unknown names", () => {
    expect(templateNameToCategoryAndType("Company Member")).toBeNull();
    expect(templateNameToCategoryAndType(null)).toBeNull();
    expect(templateNameToCategoryAndType(undefined)).toBeNull();
  });
});

describe("type guards", () => {
  it("isPermissionLevel accepts only the four levels", () => {
    for (const v of ["none", "read_only", "standard", "admin"]) {
      expect(isPermissionLevel(v)).toBe(true);
    }
    expect(isPermissionLevel("write")).toBe(false);
    expect(isPermissionLevel(null)).toBe(false);
  });

  it("isTemplateCategory / isTemplateUserType validate the tuple space", () => {
    expect(isTemplateCategory("company")).toBe(true);
    expect(isTemplateCategory("invitee")).toBe(true);
    expect(isTemplateCategory("bogus")).toBe(false);

    expect(isTemplateUserType("company", "super_admin")).toBe(true);
    expect(isTemplateUserType("invitee", "subcontractor")).toBe(true);
    // Rejects empty / non-string values.
    expect(isTemplateUserType("company", "")).toBe(false);
    expect(isTemplateUserType("company", 123)).toBe(false);
  });
});
