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
