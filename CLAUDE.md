# SiteCommand – Project Notes for Claude

## User Role Definitions

### 1. Site Command Admin *(internal team only)*
- Access to a super admin dashboard
- Toggle features on/off per company
- Impersonate or assist company admins for support
- Manage billing, plans, and seats across all accounts
- No access to actual project data unless needed for support

### 2. Company Super Admin *(the person who signed up / owns the account)*
- Manages the company's subscription and seats
- Invites and removes users within the company
- Promotes users to Admin
- Grants company users access to specific projects
- Full access to all projects under their company

### 3. Company Admin *(promoted by the Super Admin)*
- Can invite users and assign them to projects (within available seats)
- Full access to projects they're assigned to
- Cannot manage billing or change other admins' permissions

### 4. Company Member *(standard internal user)*
- Can only see and work within projects they've been added to
- Full create/edit/delete rights within those projects
- No user management capabilities

### 5. External Collaborator *(subcontractor, architect, owner, etc.)*
- Invited directly to a specific project, not the company
- Can respond to RFIs and submittals they're tagged on
- View-only everywhere else unless explicitly granted edit on a section
- No visibility into other projects or company data

## Commitments Tool

### Overview
- Project-level tool for managing purchase orders and subcontracts
- Lives under the project's **Contracts** tab
- Centralized data table with customizable columns (resize, show/hide, sort, pin), filtering, grouping, inline status edits, and CSV/PDF export

### Prerequisites
- The Commitments tool must be added to the project
- Advanced settings must be configured, including the accounting method for each commitment:
  - **Amount Based**
  - **Unit/Quantity Based**

### Tool-Level Permissions
The Commitments tool uses its own per-tool permission levels that layer on top of the role definitions above:
- **None** – no access
- **Read Only** – can view commitments and SOVs
- **Standard** – can work on items they are explicitly tied to (e.g., invoice contact) when granular permissions are enabled
- **Admin** – full create/edit/delete on commitments, SOVs, and Subcontractor SOVs

Role-to-tool mapping for SiteCommand:
- Site Command Admin: no project data access by default; may elevate for support
- Company Super Admin / Company Admin: Admin on Commitments for projects they manage
- Company Member: permission level set per project (Read Only, Standard, or Admin)
- External Collaborator: Read Only by default; may be set as **Invoice Contact** on a specific contract to edit that contract's Subcontractor SOV

### Schedule of Values (SOV) – Add a Line Item
- Requires **Admin** on the Commitments tool
- Commitment must be in **Draft**, unless **Enable Always Editable Schedule of Values** is turned on
- Steps: open the commitment → **Edit** → **Schedule of Values** → **Add Line**
- Required fields depend on accounting method:
  - **Amount Based**: budget code, description, amount
  - **Unit/Quantity Based**: budget code, description, quantity, UOM, unit cost (amount auto-calculates from qty × unit cost)
- For both methods: line number (**#**) is auto-generated sequentially, **Billed to Date** auto-calculates, and **Amount Remaining** is entered manually (unbilled amount)
- Optional per line: Change Event Line Item (if change events are enabled), Tax Code (if tax codes feature is enabled)
- **Save** or **Save & Email** (notifies the invoice contact)
- ERP integrations may add their own prerequisites and limitations

### Subcontractor SOV (SSOV) – Add to a Commitment
Lets a downstream contractor provide a detailed cost breakdown for each commitment line item, so the general SOV and the subcontractor's detail line up before invoicing.

Prerequisites:
- Contract must use **Amount Based** accounting (Unit/Quantity is not supported)
- **Subcontractor SOV** tab must be enabled on the commitment
- SSOV status must be **Draft** or **Revise & Resubmit**

Who can add SSOV line items:
- **Admin** on Commitments – on any contract
- **Invoice Contact** with Read Only or higher – on their assigned contract
- **Read Only** or **Standard** on a **non-private** contract – if the **Create Purchase Order Contract** or **Create Work Order Contract** granular permission is enabled
- **Standard** on a **private** contract – only if the user is both the Invoice Contact and a Private member, and the contract has **Allow Users to See SOV Items** checked

Workflow:
1. Admin creates/updates the general SOV on the commitment
2. Admin clicks **Send SSOV Notification** to alert the invoice contact (an invoice contact must be assigned first; otherwise add one before sending)
3. Invoice contact clicks **Edit** and adds detail lines until **Remaining to Allocate** is $0 — **Submit** stays disabled until the full committed amount is allocated
4. Invoice contact clicks **Submit**; status moves to **Under Review** (editing is blocked again unless returned to **Revise & Resubmit**)

Notes:
- Detail line items carry over to the invoice; only the detail lines carry over, not the general SOV lines
- SSOV detail does **not** sync with integrated ERP systems — only the general SOV does

## Change Events (Budget Changes) – Product Manual Alignment

### Overview
- The modern Change Events workflow is tied to Procore's **Budget Changes** experience, which replaces legacy budget modifications.
- Teams can configure **Budget ROM (Rough Order of Magnitude)** logic so Procore predicts budget impact using business rules.
- When a budget change is created from the Budget tool, Procore can auto-create and link a related change event.

### Details to Mirror in Product Messaging
- Support the three Budget ROM scopes in settings:
  - **In Scope**
  - **Out of Scope**
  - **TBD Scope**
- For each scope, support ROM source options:
  - **Latest Cost**
  - **Latest Price**
  - **None**
- Reflect that budget changes can be reviewed in the Budget tool and can also be created from a change event through a **Financial Impact** workflow.
- Reflect that teams can configure whether budget changes automatically create linked change events.

### Common Questions / Migration Notes
- Migration from **Budget Modifications** to **Budget Changes** is required (timeline managed by Procore).
- Companies using custom or third-party API integrations must update deprecated budget modification endpoints before migration.
- After migration:
  - Budget changes can sync with supported ERP integrations.
  - Legacy budget modifications no longer sync with ERP.
  - Users must use the modernized Change Events experience.
- Reporting impact should be called out: budget modifications and budget changes appear differently across snapshots, enhanced reporting, company/project reports, and analytics.
- During migration, only legacy budget modifications already linked to change event line items keep those associations; new associations are not created automatically.

## Change Events + T&M Tickets – Manual-Specific Workflow Alignment

### Add a Change Event Line Item to an Unapproved Commitment
- Bulk action name should read **Add to Unapproved Commitment**.
- Users can select line items across multiple change events before running the bulk action.
- Only unapproved commitments are valid targets.
- Do not allow this action when:
  - The commitment status is **Approved**.
  - Invoices already exist on the commitment.
- Expected result: selected change event line items create additional SOV lines on the chosen commitment.
- Permissions baseline:
  - **Admin** on Change Events.
  - **Admin** on Commitments.

### Add a Change Event Line Item to an Unapproved Prime PCO
- Bulk action name should read **Add to Unapproved Prime PCO**.
- Users can select line items from multiple change events.
- Only prime PCOs that are **not Approved** are valid targets.
- Expected result: selected change event line items are added to the prime PCO SOV.
- Permissions baseline:
  - **Admin** on Change Events.
  - **Admin** on Prime Contracts.

### Add a T&M Ticket to a Change Event
- In the T&M Tickets tool, support bulk actions for:
  - **Add to an Existing Change Event**
  - **Create Change Event**
- When linked, T&M ticket line items transfer to the change event.
- T&M ticket references/attachments should be represented in the change event description context.

## Budget + ERP + WBS Alignment Notes (Added April 17, 2026)

### About the Procore Standard Forecast View
- Treat **Procore Standard Forecast** as the default baseline forecasting layout.
- Keep Advanced Forecasting behavior configurable at the tool/settings level.
- Forecasting views should be assignable per project and designed as templates layered on top of the standard baseline.
- Forecasting UX should keep these high-signal columns visible by default:
  - Revised Budget
  - Projected Budget
  - Projected Costs
  - Forecast to Complete
  - Estimated Cost at Completion
  - Projected Over/Under

### About the Project Status Snapshots Tab
- The Budget tool should expose a dedicated **Project Status Snapshots** experience.
- Users should be able to:
  - View all snapshots over the project lifecycle.
  - Export snapshot list data to CSV.
  - Change snapshot status for approval tracking.
  - Compare two snapshots to analyze variance.
- Permissions baseline:
  - Read-only or higher on Budget to view snapshot list.
  - Elevated permissions for creating/updating snapshots.

### Accept or Reject a Budget for Export to ERP
- Budgets sent to ERP should pass through an accounting review state before export.
- Accounting approvers should be able to **Accept** (export) or **Reject** (return to editable budget state with reason).
- ERP-specific revision metadata may appear even for original budgets; users can ignore revision fields when no revision is being exported.
- Restriction messaging should be explicit:
  - ERP-exported budgets impact unlock/edit behavior.
  - Import/export rules vary by ERP connector.

### Activate Budget Codes on a Project
- Budget codes should support active/inactive lifecycle at the project level.
- Inactive codes should be excluded from budget-code dropdowns in project financial tools.
- Activation should support:
  - Single-code activation.
  - Bulk activation.
- Permission baseline should mirror Project Admin + WBS granular permission controls.

## Budget Tutorials Alignment Notes (Added April 17, 2026)

### Add a Budget Line Item
- Require both **Cost Code** and **Cost Type** when creating or editing a budget line item.
- Treat **Cost Code + Cost Type** as a unique budget code combination at the project level to prevent duplicates.
- Keep support for setting an original amount on unlocked budgets and preserve lock behavior on original amounts after budget lock.

### Add a GST to a Budget
- Provide a dedicated quick action for creating a **GST Budget Line Item**.
- GST entries should default the cost type to **Other** while still allowing users to set a dedicated tax cost code.
- Keep GST line items visually identifiable in the table so teams can report/govern tax tracking more clearly.

### Add a Job to Date Costs Column to a Budget View
- Keep **Job to Date Costs** visible as a source column in the Budget table and preserve a clear formula relationship with **Direct Costs**.
- Continue surfacing column-level formula help text so users can understand how calculated values are produced.
- For non-ERP projects, maintain language and UX that treats this as a configurable budget-view reporting column behavior.

### Add a Partial Budget Line Item
- Support creating **partial/unbudgeted budget line items** directly in the budget workflow.
- Partial line items should be created with a **$0 Original Budget Amount** and remain editable through downstream budget-change workflows.
- Keep partial line items visually marked (for example, with a `?` indicator) to help users identify unbudgeted scope quickly.

## 360 Reporting – Workflow Alignment Notes

### Export a Report
- Support export formats directly from report output:
  - **CSV**
  - **XLSX**
  - **PDF**
- Export actions should use the currently visible report state (filters, date range, calculated columns, grouping context when applicable).
- Clearly communicate row-limit constraints in the UI for heavy datasets when required.

### Get a Custom 360 Report from Assist
- Provide an **Assist** entry point in Reporting for users to describe desired outcomes in plain language.
- Assist should recommend a starting report/template and allow immediate creation from that recommendation.
- Keep the Assist flow lightweight: prompt → recommendation → create report draft.

### Promote a Project Report to Company Level
- Project reports can be promoted for reuse at the company level by authorized users.
- Promotion should be explicit and auditable in UI state (timestamp and actor).
- After promotion, report should be treated as a reusable company template while the project copy remains traceable.

### Share a Report
- Sharing should be report-specific and separate from dashboard sharing.
- Allow selecting target audiences (internal groups and, when allowed, external collaborators).
- Save share recipients with the report and reflect shared state in report management views.

### Edit / Distribute / Delete Lifecycle Expectations
- **Edit**: users can update report metadata post-creation without losing calculation configuration.
- **Distribute Snapshot**: users can send static report snapshots to recipients with format + schedule options.
- **Delete**: destructive action must require confirmation and clearly state irreversibility.

### Visual Type Configuration Expectations
- Offer visual tiles for at least:
  - Tabular Report
  - Bar Chart (vertical + horizontal)
  - Line Chart
  - Donut Chart
  - Stacked Bar Chart
  - Scorecard
- Creating a visual should follow a consistent sequence:
  1. Select visual type.
  2. Select dataset/report definition.
  3. Configure axes/measures (or columns for tabular reports).

## Budget Tutorials Alignment Notes (Added April 17, 2026 - Round 2)

### Add the Columns for Job Cost Transaction Syncing to a Budget View for ERP Integrations
- Keep ERP-oriented budget views configured around **Job to Date Costs** and **Direct Costs** to preserve transaction-based visibility.
- Treat **Direct Costs** as a calculated value tied to source-cost detail visibility controls, and keep formula help text visible in-column.
- Maintain ERP-specific messaging that this setup is intended for supported ERP-connected workflows where job cost transactions are synced.

### Add the Columns for the Budget Changes Feature to a Budget View
- Ensure budget views used for change workflows expose source and calculated columns required for **Pending Budget Changes** and **Approved Change Order** analysis.
- Preserve the expectation that teams may either modify an existing view or create a dedicated **Budget Changes** view, then assign it to projects.
- Keep this configuration aligned with Change Events settings (including Budget ROM behavior).

### Add the Unit-Based Columns to a Budget View
- Support non-ERP unit-based budgeting workflows with these high-signal fields in budget experiences:
  - **Budget Unit Qty**
  - **Unit of Measure**
  - **Unit Cost**
- Preserve behavior where **manual calculation** can be toggled so teams can either enter an amount directly or derive it from unit inputs.
- Keep ERP caveat messaging clear: unit-based syncing behavior varies by ERP connector.

### Analyze Line Item Variance Between Budget Snapshots (Beta) / Analyze Variances Between Budget Snapshots
- Snapshot comparison UX should support selecting snapshot pairs and reviewing variance at the line-item level.
- Provide display modes for:
  - Comparison + variance values
  - Comparison values only
  - Variance values only
- Keep snapshot-level permissions language aligned with Budget tool expectations (read access for visibility, elevated access for creation/management).

### Apply Advanced Forecasting Curves
- Forecasting workflows should capture **Start Date**, **End Date**, and **Curve** per line item.
- Supported curve language should include at least:
  - **Linear**
  - **Bell**
  - **Manual**
- Keep **Procore Standard Forecast** as the baseline concept while allowing custom forecasting views.

### Apply the View, Group, and Filter Options on the Budget Detail Tab
- Budget Details UX should expose all three controls at the top of the tab:
  - **View**
  - **Group**
  - **Filter**
- Group/filter options should account for WBS-driven behavior (for example, Cost Code tiers and cost type groupings).

## Budget View Configuration Alignment (Added April 17, 2026)

### Add a Real-Time Labor Productivity Budget View
- Budget workflows should support a labor-productivity-focused layout that combines:
  - Budgeted production quantities
  - Installed quantities
  - Actual labor hours and labor cost
- The Budget UI should expose labor productivity metrics (for example units/hour and cost/hour) using live project entries.
- Messaging should reflect that this view is intended to reduce manual waiting/entry for labor cost visibility.

### Add Budgeted Production Quantities to a Project's Budget
- Include a dedicated Production Quantities experience at the project budget level.
- Line items should support:
  - Budgeted quantity
  - UOM
  - Installed quantity
- Require Budget admin-level access in role/permission mapping for editing production quantity entries.

### Add Cost ROM, RFQ, and Non-Commitment Cost Source Columns
- Budget views should allow Change Event source columns for:
  - Cost ROM
  - Cost RFQ
  - Non-Commitment Cost (NCC)
- Keep these values visible as distinct source data from standard budget amounts.
- Preserve workflow clarity that these columns are intended for Change Event financial impact tracking before/without commitment linkage.

### Add the ERP Direct Costs Column to a Budget View
- Budget views should support ERP-specific job cost source data:
  - ERP Job to Date Costs (source)
  - ERP Direct Costs (calculated from direct cost + ERP job cost source)
- Surface this as budget-view configuration behavior for ERP-integrated projects.
- Keep UI language clear that ERP-based columns are integration-driven and may be unavailable when ERP configuration is not enabled.
  4. Configure sort direction and optional advanced options.
- Advanced options should include as applicable:
  - Display units
  - Decimal precision
  - Max bars displayed
  - Legend/value labels toggles
  - Dual-axis and line-point toggles for line/combined visuals

### Filters and Calculations Expectations
- Keep **Load Data Manually** enabled by default to support larger datasets.
- Allow users to switch to auto-load behavior when needed.
- Filters should support common string conditions (match, contains, starts/ends with) and be composable.
- Calculation builder should support:
  - Basic math calculations with source columns and constants
  - Date variance calculations
  - Output format controls (number/currency/percent/date variance)
  - Decimal place and rounding behavior

### Convert Report to Dashboard Expectations
- Support converting an existing saved report directly into a draft dashboard.
- Conversion flow should mirror:
  - Open report
  - Preview in dashboard
  - Optional edits/additional visuals
  - Save as draft/publish later
- Dashboards should clearly enforce publish-before-share behavior.

### Edit 360 Report (Visuals + Dashboard Layout) Expectations
- Report editing should support:
  - Updating report title and description.
  - Adding tabs and reordering tabs.
  - Tab menu actions (rename, duplicate, delete).
  - Adding visuals from the editor and saving report-level changes.
- Visual card controls should include:
  - Edit card settings (title/description/config).
  - Duplicate card.
  - Delete card (irreversible warning).
  - Fullscreen card viewing/editing when possible.

### Add Visual to Project Single Tool Report Expectations
- Add Visual should be accessible from a report-level editor/menu flow.
- Respect workflow constraints:
  - Only report creator can add visuals to a cloned report.
  - Add Visual is available when record count is below the configured large-data threshold (2,500 in current guidance).
- Support PDF export including visuals when visuals are present.

### Aggregate Data in Project Single Tool Report Expectations
- Provide aggregate functions per column:
  - Count
  - Sum
  - Min
  - Max
  - Average
- Aggregation should be configurable from report edit controls and rendered in report output (e.g., summary/footer row).
- Function options should be constrained by field type where feasible (non-numeric fields default to count-only).

### Copy Project Single Tool Report Expectations
- Provide a **Make a Copy** action from report row actions and from within an opened report context.
- New copies should:
  - Be independent snapshots from the source report.
  - Append `-Copy` to the report name.
  - Preserve share-safe visibility semantics (copy only reveals data user can access).

## Procore Process-Guide Alignment Notes (Added April 17, 2026)

### Sources Reviewed
- https://v2.support.procore.com/process-guides/about-budget-changes/
- https://v2.support.procore.com/process-guides/about-budget-changes-on-owner-invoices/
- https://v2.support.procore.com/process-guides/budget-and-forecast-snapshots-user-guide/
- https://v2.support.procore.com/process-guides/company-administration-work-breakdown-structure-guide/

### Budget Changes + Change Events
- Keep language aligned to modern **Budget Changes** (not legacy Budget Modifications) for net-new workflows.
- Keep **Budget ROM** framing explicit across three scopes:
  - In Scope
  - Out of Scope
  - TBD Scope
- Keep ROM source guidance visible in UX copy and workflow docs:
  - Latest Cost
  - Latest Price
  - None
- Preserve messaging that Budget Changes can auto-create linked Change Events and can also be handled through Financial Impact workflows.

### Budget Changes on Owner Invoices
- Reflect that not every financial adjustment must use a Prime Contract Change Order (PCCO), especially in GMP/allowance-contingency scenarios.
- Keep support for adding approved budget changes to the latest owner invoice and grouping those lines for billing review.
- Keep owner-invoice workflow references in change-management guidance to reduce CO-overuse.

### Budget + Forecast Snapshots
- Treat snapshots as point-in-time financial baselines for variance analysis.
- Maintain user guidance for snapshot lifecycle actions:
  - Create snapshot
  - View snapshot
  - Configure/apply budget view context
  - Analyze variance
  - Export snapshot / export snapshot list
- Position snapshots as monthly-close and executive reporting controls.

### WBS (Company Administration)
- Treat WBS as a company-governed setup sequence before project-level execution:
  1. Define custom segments.
  2. Define segment items.
  3. Configure default cost code and cost type segments (including UOM where needed).
  4. Enable optional sub jobs.
  5. Set budget code structure and project edit controls.
- Keep project-level financial workflows dependent on stable company-level WBS governance.

### 360 Reporting Alignment Checklist
- Ensure report exports support **CSV, XLSX, and PDF** from current visible report state.
- Keep Assist flow lightweight: prompt -> recommendation -> create draft.
- Keep promotion audit metadata explicit (promoted timestamp + actor).
- Keep sharing model report-specific and distinct from dashboard sharing.
- Keep Add Visual threshold behavior explicit for large datasets (2,500+ row constraint messaging).
- Keep dashboard publish-before-share behavior explicit.
