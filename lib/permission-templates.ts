export type PermissionLevel = "none" | "read_only" | "standard" | "admin";

export type PermissionTemplateName =
  | "Subcontractor"
  | "Architect/Engineer"
  | "Owner/Client";

export type TemplateRow = {
  tool: string;
  level: PermissionLevel;
  granularPermissions?: string[];
};

export const PERMISSION_TEMPLATE_ORDER: PermissionTemplateName[] = [
  "Subcontractor",
  "Architect/Engineer",
  "Owner/Client",
];

export const PERMISSION_TEMPLATES: Record<PermissionTemplateName, TemplateRow[]> = {
  "Subcontractor": [
    { tool: "Home", level: "read_only" },
    { tool: "Emails", level: "standard" },
    { tool: "Prime Contracts", level: "none" },
    { tool: "Budget", level: "none" },
    {
      tool: "Commitments",
      level: "standard",
      granularPermissions: ["View and Select Budget Codes for Change Orders Outside the Contract's Scope"],
    },
    { tool: "Change Orders", level: "read_only" },
    { tool: "Change Events", level: "none" },
    { tool: "RFIs", level: "read_only" },
    { tool: "Submittals", level: "read_only" },
    { tool: "Transmittals", level: "none" },
    { tool: "Punch List", level: "standard" },
    { tool: "Meetings", level: "read_only" },
    { tool: "Schedule", level: "read_only" },
    { tool: "Daily Log", level: "none" },
    { tool: "360 Reporting", level: "none" },
    { tool: "Photos", level: "read_only" },
    { tool: "Drawings", level: "read_only" },
    { tool: "Specifications", level: "read_only" },
    { tool: "Documents", level: "standard" },
    { tool: "Directory", level: "none" },
    { tool: "Cover Letters", level: "none" },
    { tool: "Tasks", level: "none" },
    { tool: "Admin", level: "none" },
    { tool: "Connection Manager", level: "none" },
    { tool: "Scheduling", level: "none" },
    { tool: "Webhooks API", level: "none" },
    { tool: "Agent Builder", level: "none" },
  ],
  "Architect/Engineer": [
    { tool: "Home", level: "read_only" },
    { tool: "Emails", level: "standard" },
    {
      tool: "Prime Contracts",
      level: "read_only",
      granularPermissions: ["View payment application detail"],
    },
    { tool: "Budget", level: "none" },
    { tool: "Commitments", level: "none" },
    { tool: "Change Orders", level: "standard" },
    { tool: "Change Events", level: "none" },
    { tool: "RFIs", level: "standard" },
    {
      tool: "Submittals",
      level: "standard",
      granularPermissions: ["Create Submittal"],
    },
    { tool: "Transmittals", level: "standard" },
    { tool: "Punch List", level: "standard" },
    { tool: "Meetings", level: "admin" },
    { tool: "Schedule", level: "read_only" },
    { tool: "Daily Log", level: "none" },
    { tool: "360 Reporting", level: "none" },
    { tool: "Photos", level: "standard" },
    {
      tool: "Drawings",
      level: "standard",
      granularPermissions: ["Upload Drawings", "Upload and review Drawings"],
    },
    { tool: "Specifications", level: "read_only" },
    { tool: "Documents", level: "standard" },
    { tool: "Directory", level: "none" },
    { tool: "Cover Letters", level: "none" },
    { tool: "Tasks", level: "none" },
    { tool: "Admin", level: "none" },
    { tool: "Connection Manager", level: "none" },
    { tool: "Scheduling", level: "none" },
    { tool: "Webhooks API", level: "none" },
    { tool: "Agent Builder", level: "none" },
  ],
  "Owner/Client": [
    { tool: "Home", level: "read_only" },
    { tool: "Emails", level: "standard" },
    {
      tool: "Prime Contracts",
      level: "none",
      granularPermissions: ["View payment application detail"],
    },
    { tool: "Budget", level: "none" },
    { tool: "Commitments", level: "none" },
    { tool: "Change Orders", level: "standard" },
    { tool: "Change Events", level: "none" },
    { tool: "RFIs", level: "standard" },
    {
      tool: "Submittals",
      level: "standard",
      granularPermissions: ["Create Submittal"],
    },
    { tool: "Transmittals", level: "read_only" },
    { tool: "Punch List", level: "standard" },
    { tool: "Meetings", level: "read_only" },
    { tool: "Schedule", level: "read_only" },
    { tool: "Daily Log", level: "read_only" },
    { tool: "360 Reporting", level: "read_only" },
    { tool: "Photos", level: "standard" },
    { tool: "Drawings", level: "read_only" },
    { tool: "Specifications", level: "read_only" },
    { tool: "Documents", level: "standard" },
    { tool: "Directory", level: "none" },
    { tool: "Cover Letters", level: "none" },
    { tool: "Tasks", level: "none" },
    { tool: "Admin", level: "none" },
    { tool: "Connection Manager", level: "none" },
    { tool: "Scheduling", level: "none" },
    { tool: "Webhooks API", level: "none" },
    { tool: "Agent Builder", level: "none" },
  ],
};
