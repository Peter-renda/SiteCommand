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

## Change Orders + Financials Workflow Notes (Added April 17, 2026)

### Enable the Change Orders Tool
- Keep Change Orders as a configurable, project-level active tool.
- Admin workflow expectation:
  1. Open project **Admin**.
  2. Open **Active Tools**.
  3. Enable **Change Orders**.
  4. Save/update tool settings.
- Permission baseline: project Admin-level users manage tool activation.

### Enable Labor Productivity Cost Features
- In project Admin advanced settings, expose a toggle equivalent to **Labor Productivity for Budget, Change Events, and Change Orders**.
- This setting should be treated as a project-financials capability flag that influences Budget, Change Events, and Change Orders experiences together.

### View Change Orders
- Change Orders should remain a centralized viewing tool for both:
  - Prime Contract Change Orders (PCCOs)
  - Commitment Change Orders (CCOs)
- Keep separate tabs for Prime Contracts and Commitments.
- Change order creation should continue to happen from the parent financial contract workflows, not from the viewing list itself.

### Export a Single Change Order
- Support exporting an individual change order directly to **PDF** from its detail page.
- Support quick PDF export from list context where possible.
- Export should preserve key contract/accounting context (including budget code/SOV line data when present).

### Export a List of Change Orders (CSV/PDF)
- Support both **CSV** and **PDF** list exports from the Change Orders list UI.
- Exports should apply:
  - active tab scope (Prime vs Commitment),
  - current filters,
  - current sort order.

### Approve or Reject Change Orders (Reviewer Flow)
- A change order may have exactly one **Designated Reviewer**.
- Reviewer action eligibility:
  - User must be the designated reviewer.
  - Status must be a pending review state (for example, **Pending - In Review** or **Pending - Revised**).
- On Approve/Reject response:
  - update status,
  - set reviewer identity,
  - stamp review date,
  - persist reviewer response history context.

### Determine Approval Order
- Track an explicit **approved timestamp** on each change order.
- Surface approval chronology in the log so teams can identify the most recently approved item first.
- If an approved item needs to be edited/deleted, enforce or guide reverse-order unapproval behavior (latest approved first).

### Create Budget Codes in Financial Tools
- Continue supporting budget-code creation inline from financial line item/SOV entry flows.
- Support segmented budget-code composition from project WBS segments.
- Allow default concatenated description and optional custom description when creating a new code.

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

## Change Orders / ERP Alignment Notes (Added April 17, 2026)

### Edit a Change Order
- The project-level **Change Orders** tool should be treated as a central index for locating change orders, not as the sole authority for edit permissions.
- Edit eligibility should continue to defer to the parent financial tool permissions:
  - **Commitment Change Orders (CCOs)**: Admin on Commitments.
  - **Prime/Client/Funding Change Orders**: Admin on the corresponding contract tool.
- Keep explicit UX messaging that users may be blocked from editing/deleting based on status order and approval sequencing (for example, older approved COs may require rollback of newer approvals before edits).

### Configure Settings: Change Orders (Project Tool)
- Maintain project-level settings for:
  - Show/hide line items on **PCCO PDF exports**.
  - Show/hide line items on **CCO PDF exports**.
  - **Change reason behavior** mode:

## Procore Tutorial Alignment Notes (Added April 17, 2026 - DocuSign/ERP/Prime CO Round)

### Sources Reviewed
- https://v2.support.procore.com/product-manuals/docusign/tutorials/link-your-docusign-account-to-a-procore-project/
- https://v2.support.procore.com/product-manuals/erp-integrations-company/tutorials/retrieve-a-cco-from-erp-integrations-before-acceptance/
- https://v2.support.procore.com/product-manuals/commitments-project/tutorials/submit-a-field-initiated-change-order-as-a-collaborator/
- https://v2.support.procore.com/product-manuals/prime-contracts-project/tutorials/add-a-related-item-to-a-prime-contract-change-order/
- https://v2.support.procore.com/product-manuals/prime-contracts-project/tutorials/add-filters-to-the-change-orders-tab-on-a-prime-contract/
- https://v2.support.procore.com/product-manuals/prime-contracts-project/tutorials/add-financial-markup-to-prime-contract-change-orders/
- https://v2.support.procore.com/product-manuals/change-orders-project/tutorials/approve-or-reject-prime-contract-change-orders/
- https://v2.support.procore.com/product-manuals/prime-contracts-project/tutorials/configure-the-number-of-prime-contract-change-order-tiers/

### Link Your DocuSign Account to a Project
- Preserve two linking paths in guidance:
  - Link from profile settings.
  - Link from a DocuSign-enabled project workflow.
- Make synced-state messaging explicit once credentials are linked.

### Retrieve a CCO from ERP Integrations Before Acceptance
- Keep a **Retrieve from ERP** action available while a CCO is still pending accounting acceptance.
- After retrieval, unlock editing and allow re-send after correction.
- Keep permission baseline aligned with Commitments/Change Orders admin workflows.

### Submit a Field-Initiated Change Order as a Collaborator
- Keep collaborator flow scoped to approved commitments with correct permissions.
- Preserve private-by-default behavior for collaborator-initiated commitment COs.
- Keep auto-linked contract context and sequential numbering behavior in form guidance.

### Add a Related Item to a Prime Contract Change Order
- Keep related-item concept explicit as a cross-tool linkage between project records.
- Require active tools + view permissions for type/description selection visibility.
- Keep this as a detail-record workflow (open change order -> related items -> edit/save).

### Add Filters to the Change Orders Tab on a Prime Contract
- Keep Add Filter controls for:
  - Status
  - Executed
  - Change Reason
  - Change Type
- Preserve clear-all and per-filter clear behavior in UX expectations.

### Add Financial Markup to Prime Contract Change Orders
- Keep financial markup language aligned to two concepts:
  - Horizontal (line-level)
  - Vertical (subtotal-level)
- Keep project/tool-level prerequisites and permission messaging visible in workflow copy.

### Approve or Reject Prime Contract Change Orders
- Keep designated-reviewer logic strict:
  - Exactly one reviewer assigned.
  - Review actions allowed only in **Pending - In Review** or **Pending - Revised**.
- Record reviewer identity, comments context, and review date on response.

### Configure Number of Prime Contract Change Order Tiers
- Keep supported tier modes aligned to 1-tier, 2-tier (default), and 3-tier guidance.
- Enforce that tier configuration is set before creating the first prime-side CO.
- Disallow tier reconfiguration after first prime CO exists on the project.
    - predefined drop-down list, or
    - freeform text input.
- Keep permissions messaging explicit that these settings require **Admin** on the project Change Orders tool.

### Company Defaults: Change Management
- Company Admin should be the source of truth for default change-management lists:
  - **Change Reasons**
  - **Change Types**
  - **Change Event Statuses**
- Project tools should consume company defaults while allowing project-level availability toggles.
- Do not allow deletion of reasons/types/statuses that are already referenced by existing records.

### Commitment Change Orders + ERP Accounting Acceptance
- Add/maintain a clear pre-export accounting review stage for CCOs:
  - **Ready to Export** queue for accounting approvers.
  - **Accept** path exports to ERP.
  - **Reject** path returns CCO to editable project state with a required reason.
- Permissions model should distinguish between general ERP access and explicit “can push to accounting” privileges.

### Commitment Tool: Collaborator / Field-Initiated Change Orders
- Commitments advanced settings should support:
  - **Number of Commitment Change Order Tiers** (1, 2, or 3).
  - One-tier option for **Allow Standard Users to Create CCOs**.
  - Multi-tier option for **Allow Standard Users to Create PCOs**.
  - **Enable Field-Initiated Change Orders** (dependent on multi-tier + standard-user PCO setting).
- Field-initiated flows should support collaborator submissions against approved commitments while preserving contract privacy boundaries.

### Configure Number of Change Order Tiers (Cross-Tool Concept)
- Treat tier configuration as a contract lifecycle decision that should be set before live CO workflows begin.
- Preserve tool-specific tier behavior (Client Contracts, Commitments, Funding, Prime Contracts) while keeping the UX language consistent across financial tools.

### Create a Change Order / Create from Change Event
- Keep direct CO creation and change-event-originated CO creation as first-class flows.
- When creating from change events, preserve source linkage metadata so downstream reporting and audit history can show origin context.

### Prime Contracts: Enable Financial Markup
- Prime contract advanced settings should include a dedicated **Enable Financial Markup** toggle at the contract level.
- Enabling this setting is prerequisite behavior for applying markup rules on associated prime contract change orders.

## Commitment CO Workflow Notes from Procore Tutorials (Added April 17, 2026)

### Add a Change Event Line Item to an Unapproved Commitment CO
- Keep a bulk action labeled **Add to Unapproved Commitment CO** in Change Events.
- Allow selecting line items across multiple change events.
- Only show commitment CO targets that are not **Approved**.
- Result expectation: selected change event line items append as additional SOV lines on the chosen commitment CO.
- Permissions baseline:
  - **Admin** on Change Events.
  - **Admin** on Commitments.
- ERP caveat: linked ERP workflows may alter which options appear in bulk-action menus.

### Add a Related Item to a Commitment Change Order
- Commitment CO detail should support a **Related Items** association pattern.
- Only project tools that are active should appear as selectable related-item types.
- Related-item picker options should honor record-level view permissions in each tool.
- Permissions baseline:
  - **Admin** on Change Orders.

### Add Financial Markup to CCOs
- Require commitment-level financial markup enablement before rule entry on CCOs.
- Preserve proportional distribution behavior of markup across CCO SOV lines.
- Keep horizontal + vertical markup interaction explicit in UI/help text.
- Preserve limitation messaging:
  - CCOs with financial markup cannot be used on subcontractor invoices.
- Permissions baseline:
  - **Admin** on Commitments.

### Approve or Reject Commitment Change Orders
- Approval actions should be available to the assigned **Designated Reviewer** when CCO status is in pending review states.
- Keep reviewer identity + review date captured when action is submitted.
- Permission baseline:
  - **Standard** or above on Commitments and Change Orders, plus reviewer assignment.

### Bulk Create Commitment Change Orders from a Change Event
- Support bulk creation from selected change event line items where possible.
- Keep tiering guidance explicit in UX:
  - 2-tier: CE > CPCO > CCO
  - 3-tier: CE > CPCO > COR > CCO
- Preserve vendor/contract grouping context before record creation.
- Permissions baseline:
  - **Standard+** on Change Events.
  - **Admin** on Commitments.

### Prerequisites
- A commitment (Purchase Order or Subcontract) must exist.

### Workflow
1. Open the project's Commitments tool → **Contracts** tab → locate the contract.
2. Click **Edit**.
3. Click **Email Contract** (in the edit page header).
4. Fill in the email form:
   - **To** — select recipients from the Project Directory (must be in directory to receive emails)
   - **Cc** — additional directory contacts for carbon copy
   - **Private** — check to restrict viewing to admins and email recipients only
   - **Subject** — email subject line
   - **Message** — instructions or context for recipients
5. Click **Send**.

### What Recipients Receive
- An email with:
  - A **View Online** link (requires appropriate project access permissions).
  - A **Download PDF** link.
- Recipients must be added to the Project Directory.

### Implementation Notes (SiteCommand)
- "Email Contract" button in the edit page header (`EditCommitmentClient.tsx`).
- Opens `EmailContractModal` — recipients selected from project directory contacts with emails.
- API: `POST /api/projects/[id]/commitments/[commitmentId]/email` — requires Standard or Admin tool permission.
- Email function: `sendCommitmentEmail()` in `/lib/email.ts` using Resend.
- CC recipients passed directly to Resend's `cc` field.
- Private flag shown in email footer note when enabled.

## Enable Financial Markup on a Commitment

### Required Permissions
- **Admin** level on the Commitments tool.

### Prerequisites
- A Purchase Order or Subcontract must exist.
- Financial Markup must be **enabled at the project level** first (Commitments Settings → Financial Markup section).

### Workflow
1. Enable Financial Markup at the project level: Commitments tool → **Configure Settings** (gear icon) → **Financial Markup** → check **Enable Financial Markup on Commitment Change Orders** → **Save**.
2. Open the commitment (Commitments → Contracts tab → click contract number).
3. Click **Edit**.
4. In the **General Information** section, check **Enable Financial Markups on this commitment**.
5. Click **Save**.

### Key Limitation
- Financial markup can only be applied to **Commitment Change Orders (CCOs)** — not to the original SOV.
- Once markup is applied to a change order, that change order **cannot be added to a subcontractor invoice**.

### Implementation Notes (SiteCommand)
- Project-level toggle: `enable_financial_markup` column in `commitment_settings`, managed in `CommitmentSettingsClient.tsx`.
- Per-commitment toggle: `financial_markup_enabled` column on `commitments` table, exposed in `EditCommitmentClient.tsx` and `NewCommitmentClient.tsx`.
- The per-commitment checkbox is only shown/enabled when the project-level setting is on; otherwise, a link to Commitments Settings is shown.
- Migration: `supabase/migrations/092_commitments_extended_fields.sql` (commitment column) and `093_commitment_settings_defaults.sql` (settings column already existed in 092).
- API PATCH: `financial_markup_enabled` is an allowed field in `/api/projects/[id]/commitments/[commitmentId]/route.ts`.

## Enable or Disable the SSOV Tab on the Commitments Tool

### Overview
The Subcontractor SOV (SSOV) tab lets a downstream contractor provide a detailed cost breakdown for each SOV line item before invoicing. It can be toggled at both the **project level** (as a default) and **per individual commitment**.

### Required Permissions
- **Admin** level on the Commitments tool.

### Key Constraints
- **Amount Based accounting method only** — the SSOV tab is NOT supported with Unit/Quantity Based accounting.
- If **Enable Always Editable Schedule of Values** is active, additional workflow limitations apply.
- SSOV detail does not sync with ERP integrations; only the general SOV does.

### Project-Level Workflow (Default Setting)
1. Open the Commitments tool → **Configure Settings** (gear icon).
2. Navigate to the **Default Contract Settings** section.
3. Check or uncheck **Enable Subcontractor SOV by Default**.
4. Click **Save / Update**.

Effect: all new commitments created after saving will have the SSOV tab enabled (if Amount Based accounting method is selected).

### Per-Commitment Workflow
1. Open the commitment → **Edit**.
2. In the **Subcontractor SOV** section, check or uncheck **Enable Subcontractor SOV**.
3. **Save**.

### Implementation Notes (SiteCommand)
- Project-level default: `enable_ssov_by_default` column in `commitment_settings` (migration `093_commitment_settings_defaults.sql`).
- Settings UI: `CommitmentSettingsClient.tsx` → **Default Contract Settings** section.
- New commitment: `NewCommitmentClient.tsx` fetches `commitment-settings` on mount and pre-checks `ssovEnabled` if `enable_ssov_by_default` is true; sends `ssov_enabled` in the POST body.
- Edit commitment: `EditCommitmentClient.tsx` → **Subcontractor SOV** section toggle.
- The SSOV toggle is hidden/disabled when the commitment uses Unit/Quantity Based accounting.

## Export a Commitment (Individual)

### Required Permissions
- **Read Only** or higher on the Commitments tool.

### Workflow
1. Open the commitment detail page.
2. Click **Export** button in the page header.
3. Choose format:
   - **Export as PDF** — prints the commitment summary + SOV via browser print dialog.
   - **Export SOV as CSV** — downloads a CSV of the Schedule of Values line items.

### Implementation Notes (SiteCommand)
- Export dropdown button in `CommitmentDetailClient.tsx` header between Delete and Edit.
- `exportCommitmentPDF()` builds an HTML document with commitment metadata and SOV table, renders in a hidden iframe, and triggers `window.print()`.
- `exportSovCSV()` generates a CSV of non-group-header SOV lines; columns adapt to accounting method (Amount Based vs Unit/Quantity Based).

## Export a Commitments List

### Required Permissions
- **Read Only** or higher on the Commitments tool.

### Workflow
1. Open the Commitments tool → **Contracts** tab.
2. Apply any desired filters (the export reflects visible rows).
3. Click **Export** dropdown in the top-right actions.
4. Choose **Export as CSV** or **Export as PDF**.

### Implementation Notes (SiteCommand)
- Export dropdown in `CommitmentsClient.tsx` top-right actions bar.
- `exportCSV()` exports all currently visible items (post-filter/sort).
- `exportPDF()` builds an HTML table and prints via hidden iframe.

## Import a Subcontractor Schedule of Values from a CSV

### Required Permissions
- Admin on Commitments, OR Invoice Contact with Read Only or higher.

### Prerequisites
- Contract must use Amount Based accounting.
- SSOV tab must be enabled on the commitment.
- SSOV status must be Draft or Revise & Resubmit.

### Workflow
1. Open the commitment → **Edit** → **Subcontractor SOV** tab (or navigate to the SSOV edit page).
2. Click **Import CSV** at the bottom of the table.
3. In the modal:
   - Optionally download the **template CSV**.
   - Select delimiter (Comma or Semicolon).
   - Choose a CSV file.
   - Click **Import**.
4. The CSV is parsed and lines are loaded into the table for review before saving.

### CSV Required Columns
- **SOV Position Number** — maps the detail line to the parent SOV line by position.
- **Subcontractor SOV Amount** — the dollar amount for the detail line.

### Optional Columns
- **Budget Code**
- **Description**

### Implementation Notes (SiteCommand)
- Import CSV button in `SsovEditClient.tsx` at the bottom of the SSOV table (visible when not read-only).
- `downloadTemplate()` creates and downloads a sample CSV template.
- `parseImportCSV()` parses the file respecting the chosen delimiter, validates required columns, and returns `SsovLine[]` or an error string.
- Success banner shown after import; imported lines are in edit state (not yet saved) so the user can review before clicking Save.

## Manage Rows and Columns in the Commitments Tool

### Overview
Users can customize the Commitments table: show/hide columns, change row height, sort by any column, and filter by type/status/executed.

### Column Management
- Click **Table Settings** (top-right of the table toolbar) to open the column panel.
- Toggle individual columns on/off. Mandatory columns (#, Contract Company) cannot be hidden.
- **Show All** reveals all columns; **Reset** hides all optional columns.

### Row Height
- In **Table Settings**, choose Small, Medium (default), or Large row height.

### Sorting
- Click any column header to sort ascending; click again for descending; click a third time to clear.
- Sort indicator (↑ / ↓) appears on the active sort column.

### Filtering
- Click **Filters** button to open the filter panel.
- Filter by: Type (Subcontract / Purchase Order), Status (Draft / Approved / Void / Terminated), Executed (Yes / No).
- Active filter count badge shown on the Filters button.
- **Clear all** removes all active filters.

### Implementation Notes (SiteCommand)
- All state in `CommitmentsClient.tsx`: `hiddenCols` (Set<string>), `sortConfig`, `rowHeight`, `tableSettingsOpen`, `showFilterPanel`, `filterType`, `filterStatus`, `filterExecuted`.
- `ALL_COLS` defines all columns with `mandatory` flag; `COLS` is filtered by `hiddenCols`.
- `applySort()` sorts items client-side by any column key, including computed `revised_contract_amount`.
- `visibleItems` applies both search and filter predicates, then `applySort`.
- Row height classes applied to `<td>` elements: `py-1` / `py-3` / `py-5`.

## Search for and Apply Filters to the Commitments Tool

### Required Permissions
- **Read Only** or higher on the Commitments tool.

### Workflow

*Searching:*
1. Open the Commitments tool → Contracts tab.
2. Type in the Search field to filter by contract number, company, or title.

*Filtering:*
1. Click **Filters** to open the filter panel.
2. Apply filters:
   - **Contract Company** — text search to narrow by company name.
   - **Type** — Subcontract or Purchase Order.
   - **Status** — Draft, Approved, Processing, Submitted, Out For Bid, Out For Signature, Complete, Void, Terminated.
   - **Executed** — Yes, No, or Any.
3. Remove individual filters or click **Clear all** to reset.

### Implementation Notes (SiteCommand)
- Filter panel in `CommitmentsClient.tsx`: `filterCompany` (text), `filterType`, `filterStatus`, `filterExecuted`.
- Active filter count badge shown on the Filters button.
- `visibleItems` applies all four filter predicates plus search, then sort.

## View a Purchase Order

### Required Permissions
- **Non-Private POs**: Read Only or higher on Commitments.
- **Private POs**: Admin, or Read Only/Standard + membership on the Private list, or the "View Private Purchase Order Contract" granular permission.

### Workflow
1. Open the Commitments tool → Contracts tab.
2. Locate the purchase order and click its number to open the detail page.
3. Navigate tabs: General, Change Orders, Invoices, Payments Issued, Related Items, Emails, Change History, Financial Markup.

### Available Tabs
| Tab | Content |
|-----|---------|
| General | Contract details, SOV, financial summary, contract dates, privacy settings, additional information |
| Change Orders | Approved/pending change orders (placeholder — coming soon) |
| Invoices | Subcontractor invoices (placeholder) |
| Payments Issued | Payment records (placeholder) |
| Related Items | Linked documents (placeholder) |
| Emails | Communication history (placeholder) |
| Change History | Audit log of all field modifications (Admin only) |
| Financial Markup | Markup rules on change orders (requires project-level setting) |

### Implementation Notes (SiteCommand)
- `DetailTab` type in `CommitmentDetailClient.tsx` covers all tabs.
- Placeholder tabs show a "coming soon" empty state.
- Change History tab loads lazily on first click via `/api/projects/[id]/commitments/[commitmentId]/history`.

## View a Subcontract

### Required Permissions
- **Non-Private**: Read Only or higher on Commitments.
- **Private**: Admin, or Read Only/Standard + Private list membership, or "View Private Work Order Contract" granular permission.

### Workflow
1. Open the Commitments tool → Contracts tab.
2. Click the subcontract number to open the detail page.
3. Navigate tabs: same set as Purchase Order (General, Change Orders, Invoices, Payments Issued, Related Items, Emails, Change History, Financial Markup).

### Implementation Notes (SiteCommand)
- Same tab structure as PO in `CommitmentDetailClient.tsx`.
- Subcontract-specific fields (start date, estimated/actual completion, signed contract received, inclusions, exclusions) shown in the General and Additional Information sections.

## View Inclusions/Exclusions on a Subcontract

### Required Permissions
- **Non-Private**: Read Only or higher on Commitments.
- **Private**: Admin, or Read Only/Standard + Private list membership.

### Workflow
1. Open the Commitments tool → Contracts tab → click the subcontract.
2. Scroll to the **Additional Information** section.
3. View the **Inclusions — Scope of Work** and **Exclusions** fields.

### Implementation Notes (SiteCommand)
- Inclusions and Exclusions are rendered as rich-text HTML in the **Additional Information** section of `CommitmentDetailClient.tsx` for subcontracts.
- They were moved from the General Information section to Additional Information to align with Procore's layout.
- Both fields are only shown when non-empty.

## View the Change History of a Commitment

### Required Permissions
- **Admin** level on the Commitments tool.

### Workflow
1. Open the Commitments tool → Contracts tab → click the commitment.
2. Click the **Change History** tab.
3. Review the audit log — each row shows: what was changed, previous value, new value, who changed it, and when.

### Key Notes
- Change history entries are never deleted.
- Rich-text fields (description, inclusions, exclusions) record only "Updated" without showing full HTML content.

### Implementation Notes (SiteCommand)
- Database: `commitment_change_history` table (migration `094_commitment_change_history.sql`).
- API: `GET /api/projects/[id]/commitments/[commitmentId]/history` — requires Admin tool permission.
- Changes recorded in `PATCH /api/projects/[id]/commitments/[commitmentId]` by comparing old vs new values for all tracked fields.
- Tracked fields include: status, executed, contract_company, title, default_retainage, amounts, ssov_enabled, is_private, sov_accounting_method, financial_markup_enabled, dates, inclusions, exclusions, description.
- Change History tab in `CommitmentDetailClient.tsx` fetches lazily on first tab click.
