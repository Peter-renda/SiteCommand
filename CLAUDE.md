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
