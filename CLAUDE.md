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

## Create Purchase Orders – Workflow Alignment

### Prerequisites
- Complete **Configure Advanced Settings: Commitments** before creating a purchase order.
- Companies using ERP integrations may have additional requirements.

### Required Permissions
- Admin-level access to the Commitments tool, OR
- Standard-level access AND "Allow Users to See SOV Items" enabled with user selected.

### Create Purchase Order – Step-by-Step
1. Navigate to project **Commitments** tool → **Contracts** tab → **Create** → **Purchase Order**
2. **Basic Information**: Contract Number (auto-incremented, duplicates prohibited), Contract Company (from project directory), Title, Sign with DocuSign toggle
3. **General Information**: Status (default applied), Executed checkbox (legally binding), Default Retainage % (*affects first invoice only; adjust subsequent manually*), Bill To, Assigned To, Payment Terms, Ship To, Ship Via, Description
4. **Attachments**: My Computer, Photos, Drawings, Forms, Documents
5. **Accounting Method**: Amount-Based or Unit/Quantity-Based — **must be set before adding line items; cannot change afterward**; applies to all change orders and invoices
6. **Schedule of Values (SOV)**:
   - **Amount-Based fields**: line # (auto), Change Event Line Item (optional), Budget Code, Description, Amount, Billed to Date (auto), Amount Remaining, Tax Code (if enabled)
   - **Unit/Quantity-Based fields**: same + Qty, UOM, Unit Cost (amount auto-calculates from Qty × Unit Cost)
   - Option to **Import SOV from CSV** (download template, edit, upload; choose Add or Replace)
7. **Contract Dates**: Contract Date, Delivery Date, Signed Purchase Order Received, Issued On
8. **Contract Privacy**: Private toggle (default on), Invoice Contact from Contract Company employees
9. **Save**: Create / Create & Send with DocuSign / Cancel

### Key Notes
- No required fields; saving without data creates a Draft.
- Change orders and invoices require contract status **Approved** or **Complete**.
- ERP-integrated companies: character limits may apply; additional prerequisites for ERP sync.

## Create Subcontracts – Workflow Alignment

### Prerequisites
- Configure Commitments tool settings beforehand.
- DocuSign integration setup (optional).

### Required Permissions
- Admin-level Commitments permissions, OR Standard + "Allow Users to See SOV Items", OR
- Read Only or Standard with **Create Work Order Contract** granular permission (creates only, no SOV access).

### Create Subcontract – Step-by-Step
1. Navigate to project **Commitments** tool → **Contracts** tab → **Create** → **Subcontract**
2. **Basic Information**: Contract Number (auto or manual, no duplicates), Contract Company (from directory), Title, Sign with DocuSign toggle
3. **General Information**: Status, Executed checkbox, Default Retainage %, Description (rich text)
4. **Inclusions**: Specify what's covered (formatted text)
5. **Exclusions**: Define what is NOT included (formatted text)
6. **Contract Dates**: Start Date, Estimated Completion, Actual Completion, Signed Contract Received
7. **Accounting Method**: Amount-Based or Unit/Quantity-Based — **cannot change after creation**
8. **Schedule of Values (SOV)**: Same as Purchase Order (see above). CSV import supported.
9. **Attachments**: Multiple sources (My Computer, Photos, Drawings, Forms, Documents)
10. **Contract Privacy**: Private toggle (default on), Invoice Contact from Contract Company employees
11. **Additional Fields**: Cover Letter selection, Bond Amount, Trades, Exhibit A Scope of Work, Exhibit D/I Attachments, Subcontractor Contact
12. **Save**: Create / Complete with DocuSign® / Cancel

### Key Notes
- Duplicate contract number shows warning; can suppress future warnings.
- 1-Tier, 2-Tier, and 3-Tier change order configurations have different workflows.
- Alternative creation method: "Award a Winning Bid and Convert it into a Subcontract."

## Financial Markup on Commitment Change Orders (CCOs)

### Prerequisites
- **Enable Financial Markup** must be turned on for the parent commitment (set when creating or editing the commitment via the Additional Information section).
- Requires **Admin** on the Commitments tool.

### Workflow
1. Open the commitment → locate the change order (or create a new one).
2. On the Change Order form, click the **Financial Markup** tab.
3. Enable financial markup for this change order.
4. Click **Add Horizontal Markup** (displayed in same row as line items) or **Add Vertical Markup** (displayed below line items).
5. Complete the markup form:
   - **Markup Name** — identifier (e.g. "OH&P", "Insurance")
   - **Markup Percentage** — percentage value
   - **Calculation Type**:
     - *Basic Calculation*
     - *Compounds all Above*
     - *Selective Compounding* (requires selecting existing markups)
     - *Iterative Calculation (Margin)*
   - **Application Criteria**: Apply to all line items, OR apply to specific line items (Segment: Cost Code or Type; Condition: Includes or Excludes; Values)
6. Click **Save**.

### Important Restrictions
- Financial markup is distributed **proportionally** on each SOV line item in the change order.
- After applying financial markup to a CCO, **the change order cannot be added to a subcontractor invoice**.
- Markup settings apply on a **per-change-order** basis.

## 360 Reporting – Financial Management Alignment

The SiteCommand Reporting tool (Project 360 Reporting) includes a **Financial Management** report group with the following templates that align with the Commitments and Change Events tools:

| Report | Description |
|--------|-------------|
| **Commitments Summary** | All POs and subcontracts — status, amounts, approved/pending COs, ERP status |
| **Change Events** | Change events log — scope classification, ROM amounts, linkage to COs |
| **Commitment Change Orders** | All CCOs — status, amount, linked contract, change reason, due date |
| **Budget Summary** | Budget line items — original budget, committed costs, variance by cost code |

### Report Groups in 360 Reporting
- **Daily Log** — Delays, Manpower, Weather, Safety, Accidents, Inspections, Deliveries, Visitors, Notes
- **Project Tools** — RFIs, Submittals, Tasks, Punch List
- **Financial Management** — Commitments Summary, Change Events, Commitment Change Orders, Budget Summary

### Reporting Permissions
- Users with **Standard or higher** permissions can clone shared reports.
- Dashboards must be **published** before Standard or Read Only users can view them.
- Financial Management reports require **Read Only or higher** on the Commitments tool.
