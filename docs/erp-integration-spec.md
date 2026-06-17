# ERP Integration Specification & Data Dictionary

**Status:** Living specification
**Scope:** SiteCommand ⇄ QuickBooks Online (QBO, Intuit Accounting API v3, `minorversion=65`) and Sage 300 CRE (via Agave Unified API, `API-Version: 2021-11-21`)
**Companion docs:** [`erp-data-mapping-charts.md`](./erp-data-mapping-charts.md) · [`erp-onboarding-playbook.md`](./erp-onboarding-playbook.md) · [`erp-runbook.md`](./erp-runbook.md) · [`quickbooks-online-data-mapping.md`](./quickbooks-online-data-mapping.md) · [`sage-300-cre-integration.md`](./sage-300-cre-integration.md)

This is the authoritative engineering/support reference. It enumerates every configuration key, API endpoint, field mapping, error code, and database column for both ERP integrations.

> **Legend:** ✅ mapped & implemented · ⚠️ mapped with caveats · 🔭 future/out-of-scope

---

## 1. Overview

### 1.1 Scope

SiteCommand pushes financial records to an external accounting ERP and pulls back accounting feedback (totals, balances, payment status) plus job-to-date actual costs. Two ERPs are supported:

| Integration | Connectivity | System of record for parties | Library |
|---|---|---|---|
| **QuickBooks Online** | Direct HTTPS to Intuit cloud API | SiteCommand (auto-creates vendors/customers) | `lib/quickbooks.ts` |
| **Sage 300 CRE** | Via **Agave** unified API → on-prem agent → Sage Windows server | Sage (fail-fast; never auto-creates) | `lib/sage300cre.ts` |

### 1.2 Mutual Exclusion Rule

A company may connect **exactly one** ERP at a time. Enforced at:

- **QBO connect** — redirects with `error=qbo_other_erp_connected` if Sage 300 CRE is connected.
- **Sage connect** — returns **422** if QBO is connected.
- **Budget resync** — returns **422** if both are connected (pre-existing dual state) or if neither is.

To switch ERPs: disconnect the current one in **Settings → Integrations**, then connect the other.

### 1.3 Connectivity Model

```
QBO:   SiteCommand (Vercel)  ──HTTPS──▶  Intuit Accounting API v3
Sage:  SiteCommand (Vercel)  ──HTTPS──▶  Agave Unified API  ──on-prem agent──▶  Sage 300 CRE (Windows)
```

### 1.4 Sync Directions

| Direction | Trigger | Surface |
|---|---|---|
| **Push** (SiteCommand → ERP) | Manual button + daily cron | `…/sync` routes; `/api/cron/{quickbooks,sage300cre}-sync` |
| **Pull: accounting feedback** (ERP → SiteCommand) | Every push parses the response + manual refresh button + daily cron pass | `…/refresh` routes |
| **Pull: job-to-date costs** (ERP → Budget) | "Resync with ERP" button in Budget tool | `/api/integrations/erp/resync-budget` |

---

## 2. Configuration Reference

All keys resolve in precedence order **`company_integrations` (per-company) → `platform_settings` (site-wide) → environment variable**, unless noted. Per-company keys live in the `company_integrations` table.

### 2.1 QuickBooks Online

#### App credentials (required to connect)

| Key | Type | Req | Default | Notes |
|---|---|---|---|---|
| `QBO_CLIENT_ID` | string | ✅ | — | Intuit OAuth app client ID (Intuit Developer portal). |
| `QBO_CLIENT_SECRET` | string | ✅ | — | Intuit OAuth app client secret. |
| `INTUIT_REDIRECT_URI` | URL | optional | derived | Explicit OAuth callback URI. **Must byte-for-byte match the Intuit portal.** Fallback: `NEXT_PUBLIC_APP_URL` + `/api/integrations/quickbooks/callback`, then request-derived origin. |
| `INTUIT_OAUTH_SCOPES` | string | optional | `com.intuit.quickbooks.accounting` | Override for enterprise tenants needing more scopes. |

#### Company credentials (set automatically by the OAuth callback; `company_integrations` only)

| Key | Type | Notes |
|---|---|---|
| `QBO_REALM_ID` | string | QBO company file ID (`realmId`). |
| `QBO_ACCESS_TOKEN` | string | Bearer token, ~1 hr lifetime; auto-refreshed on `401` (one retry) and persisted back. |
| `QBO_REFRESH_TOKEN` | string | ~100-day lifetime; mints new access tokens. Reset on re-auth. |

#### Posting configuration (`company_integrations` → env)

| Key | Type | Req | Default | Notes |
|---|---|---|---|---|
| `QBO_ENVIRONMENT` | `sandbox`\|`production` | optional | `production` | Selects REST base. Validated in the settings PATCH. UI shows a blue **Sandbox** badge. |
| `QBO_API_BASE` | URL | optional | derived from environment | Overrides both sandbox/production bases. |
| `QBO_AP_EXPENSE_ACCOUNT` | string (account name) | optional | auto-detect first active COGS/Expense | Debit account for subcontract/AP **Bill** lines. |
| `QBO_DEFAULT_ITEM` | string (item name) | optional | `Services` | Item for PO/Invoice lines; auto-created if absent. |
| `QBO_RETAINAGE_PAYABLE_ACCOUNT` | string (account name) | optional | unset → no retainage line | When set, AP Bills withhold `billed × retainage%` as a negative line. |
| `QBO_RETAINAGE_RECEIVABLE_ACCOUNT` | string (account name) | optional | unset → no retainage line | When set, AR Invoices withhold per-line retainage via a "Retainage" item. |
| `QBO_PROJECT_TRACKING` | `class`\|`none` | optional | `class` | `class` = auto-create a QBO **Class** named after the project on every line (job-costing mechanism). `none` disables. |
| `QBO_DOC_NUMBER_PREFIX` | string | optional | unset | `project` → `{project_number}-{number}` (21-char cap). Any other value = literal prefix. Unset = bare number. Prevents cross-project DocNumber collisions in one realm. |
| `QBO_BUDGET_CODE_MAP` | JSON string | optional | `{}` | Budget code → `{account?, class?, item?}`. See §6. Validated on settings PATCH. |

**Hardcoded:** `minorversion=65` is appended to every QBO REST URL.

### 2.2 Sage 300 CRE (via Agave)

#### App credentials (required to connect)

| Key | Type | Req | Default | Header sent to Agave |
|---|---|---|---|---|
| `SAGE300CRE_CLIENT_ID` | string | ✅ | — | `Client-Id` |
| `SAGE300CRE_CLIENT_SECRET` | string | ✅ | — | `Client-Secret` |

#### Company credentials (set by the `/exchange` route; `company_integrations` only)

| Key | Type | Notes | Header |
|---|---|---|---|
| `SAGE300CRE_ACCOUNT_TOKEN` | string | Durable per-company token for the connected Sage instance. No documented expiry (lives as long as the Agave connector is installed & authenticated). | `Account-Token` |

#### Optional

| Key | Type | Default | Notes |
|---|---|---|---|
| `AGAVE_API_BASE` | URL | `https://api.agaveapi.com` | Override Agave REST base. |
| `AGAVE_API_VERSION` | string | `2021-11-21` | `API-Version` header. |

### 2.3 Shared

| Key | Type | Req | Notes |
|---|---|---|---|
| `CRON_SECRET` | string | ✅ for cron | Gate for `/api/cron/*`; request must present it. |
| `NEXT_PUBLIC_APP_URL` | URL | recommended | Base app URL; used in redirect-URI fallback and post-OAuth redirects. |

---

## 3. API Endpoint Catalog

Auth abbreviations: **SA** = Company Super Admin or Site Command Admin · **Member** = any company member · **Cron** = `CRON_SECRET` · **OAuth** = state nonce + cookie.

### 3.1 QuickBooks Online

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/api/integrations/quickbooks/connect` | SA | Validate no Sage connected; set CSRF cookie; redirect to Intuit consent. |
| GET | `/api/integrations/quickbooks/callback` | OAuth | Exchange code for tokens; store `QBO_REALM_ID`/`QBO_ACCESS_TOKEN`/`QBO_REFRESH_TOKEN`; redirect to `/settings/integrations?connected=quickbooks`. |
| POST | `/api/integrations/quickbooks/disconnect` | SA | Best-effort revoke refresh token; delete realm + tokens. Keeps app creds + environment. |
| POST | `/api/integrations/quickbooks/sync` | Member | Manual push. Body `{ recordType: commitments\|prime_contracts\|ap_invoice\|ar_invoice, recordId }`. |
| POST | `/api/integrations/quickbooks/refresh` | Member | Re-read financials. Body `{ recordType: commitments\|prime_contracts, recordId }`. |
| GET | `/api/integrations/quickbooks/accounts` | SA | List active Expense/COGS/Other-Expense accounts (Budget Code Map editor). |
| GET | `/api/integrations/quickbooks/items` | SA | List active Products & Services Items (Budget Code Map editor). |
| GET | `/api/integrations/quickbooks/customers` | SA | List active Customers. |
| GET | `/api/integrations/quickbooks/vendors` | SA | List active Vendors. |
| GET | `/api/integrations/quickbooks/projects` | SA | List QBO Projects + Customer:Job hierarchy (project-admin Customer picker). |
| GET | `/api/integrations/quickbooks/logs` | Member | 10 most recent sync logs for a record. Params `?recordType=&recordId=`. |

### 3.2 Sage 300 CRE

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/api/integrations/sage300cre/connect` | SA | Validate no QBO connected; Agave `POST /link/token/create`; return `{ linkToken }`. |
| POST | `/api/integrations/sage300cre/exchange` | SA | Body `{ publicToken }`; Agave `POST /link/token/exchange`; store `SAGE300CRE_ACCOUNT_TOKEN`. |
| POST | `/api/integrations/sage300cre/disconnect` | SA | Delete `SAGE300CRE_ACCOUNT_TOKEN` (keeps app creds). |
| POST | `/api/integrations/sage300cre/sync` | Member | Manual push. Same body as QBO sync. |
| POST | `/api/integrations/sage300cre/refresh` | Member | Re-read financials. Same body as QBO refresh. |
| GET | `/api/integrations/sage300cre/vendors` | SA | List vendors in the connected Sage company. |
| GET | `/api/integrations/sage300cre/logs` | Member | 10 most recent sync logs for a record. |

### 3.3 Shared / ERP

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/api/integrations/erp/resync-budget` | Member (company that owns the project) | Body `{ projectId }`. Detect single connected ERP; pull job-to-date costs into `budget_line_items.job_to_date_costs`. Returns `{ ok, erp, matched, updated, warning? }`. |
| GET | `/api/integrations/erp/status` | Member | `{ quickbooks: bool, sage300cre: bool, connected: "quickbooks"\|"sage300cre"\|"multiple"\|null }`. |
| PATCH | `/api/settings/company-integrations` | SA | Write whitelisted integration keys; validate `QBO_BUDGET_CODE_MAP` JSON shape and `QBO_ENVIRONMENT`. |

### 3.4 Cron

| Method | Path | Auth | Schedule | Purpose |
|---|---|---|---|---|
| GET | `/api/cron/quickbooks-sync` | Cron | Daily **17:00 UTC** | Push dirty rows (cap 25/type/company) + payment-refresh pass (25 stalest/table/company). |
| GET | `/api/cron/sage300cre-sync` | Cron | Daily **18:00 UTC** | Same logic for Sage-connected companies. |

---

## 4. Entity Crosswalk

### 4.1 QuickBooks Online

| SiteCommand record | Trigger | QBO entity | Posting? | Sync fn |
|---|---|---|---|---|
| `commitments` (`type='subcontract'`) | contract header | **Bill** | A/P | `syncCommitmentToQBO` |
| `commitments` (`type='purchase_order'`) | contract header | **PurchaseOrder** | non-posting | `syncCommitmentToQBO` |
| `prime_contracts` | contract header | **Invoice** | A/R | `syncPrimeContractToQBO` |
| `commitment_sov_items` (billed-to-date) | SOV billing | **Bill** | A/P | `syncAPInvoiceToQBO` |
| `prime_contract_sov_items` (this-period) | SOV billing | **Invoice** | A/R | `syncARInvoiceToQBO` |
| `directory_contacts` (vendor) | name ref | **Vendor** | master data | resolve/auto-create |
| `directory_contacts` (owner/client) | name ref | **Customer** | master data | resolve/auto-create |
| `projects` | per line | **Class** | master data | auto-create (when `QBO_PROJECT_TRACKING=class`) |

### 4.2 Sage 300 CRE

| SiteCommand record | Agave resource | Endpoint | Sync fn |
|---|---|---|---|
| `commitments` (subcontract or PO) | Purchase Order | `POST/PUT /purchase-orders` | `syncCommitmentToSage300Cre` |
| `commitment_sov_items` (billed-to-date) | AP Invoice | `POST/PUT /ap-invoices` | `syncAPInvoiceToSage300Cre` |
| `prime_contracts` | AR Invoice | `POST/PUT /ar-invoices` | `syncPrimeContractToSage300Cre` |
| `prime_contract_sov_items` (this-period) | AR Invoice | `POST/PUT /ar-invoices` | `syncARInvoiceToSage300Cre` |
| `projects` | Job | `GET /jobs` (resolve only) | `resolveSage300CreJobId` |
| SOV `budget_code` | Cost Code | `GET /cost-codes` (resolve only) | — |

> Vendors/customers/jobs/cost codes are **never auto-created** in Sage — Sage is the system of record.

---

## 5. Field-Level Data Dictionary (Push)

Money is `NUMERIC(15,2)` → `Number(x.toFixed(2))`. Dates are `YYYY-MM-DD`; null date keys are omitted. See §12.

### 5.1 QBO — Subcontract → Bill (`syncCommitmentToQBO`)

| SiteCommand field | QBO `Bill` field | Transform | Req | Status |
|---|---|---|---|---|
| `commitments.contract_company` | `VendorRef.value` (Id) | Resolve by name; auto-create enriched from `directory_contacts` | ✅ (422 if blank) | ✅ |
| `commitments.number` | `DocNumber` | String; optional prefix (`QBO_DOC_NUMBER_PREFIX`), 21-char cap | | ✅ |
| `commitments.title` | `PrivateNote` | direct | | ✅ |
| `commitments.start_date` | `TxnDate` | `?? today` | | ✅ |
| `commitments.estimated_completion_date` | `DueDate` | omit if null | | ✅ |
| `commitments.payment_terms` | `SalesTermRef` | exact active-Term match; else → `PrivateNote` | | ✅ |
| SOV `description` | `Line[n].Description` | one line per SOV item | | ✅ |
| SOV `billed_to_date` | `Line[n].Amount` | `Number(toFixed(2))` | | ✅ |
| SOV `qty` / `unit_cost` | `Line[n].Qty` / `UnitPrice` | only when `qty × unit_cost ≈ amount` | | ✅ |
| SOV `budget_code` | `Line[n].AccountRef` / `ClassRef` | via `QBO_BUDGET_CODE_MAP`; fallback to expense account default | | ✅ |
| project name | `Line[n].ClassRef` | auto-created Class (`QBO_PROJECT_TRACKING≠none`) | | ✅ |
| `commitments.default_retainage` | negative line → `QBO_RETAINAGE_PAYABLE_ACCOUNT` | `billed × pct`; omit when pct=0 or account unset | | ✅ |
| revised amount (orig + approved COs) | lump-sum `Line[0].Amount` | used when SOV empty | | ✅ |
| `status` = `void`/`terminated` | Bill → **delete**; clear `qbo_id` | (never-synced → skipped) | | ✅ |
| `change_orders` | — | not synced | | 🔭 |
| currency / tax | — | not synced (home currency, tax-exclusive) | | 🔭 |

### 5.2 QBO — Purchase Order → PurchaseOrder (`syncCommitmentToQBO`)

| SiteCommand field | QBO `PurchaseOrder` field | Transform | Req | Status |
|---|---|---|---|---|
| `commitments.contract_company` | `VendorRef.value` | resolve / auto-create | ✅ (422 if blank) | ✅ |
| `commitments.number` | `DocNumber` | String; optional prefix | | ✅ |
| `commitments.title` | `PrivateNote` + `Line[0].Description` | direct | | ✅ |
| `commitments.issued_on_date` \|\| `contract_date` | `TxnDate` | YYYY-MM-DD | | ✅ |
| `commitments.delivery_date` | `DueDate` | YYYY-MM-DD | | ✅ |
| `commitments.ship_to` | `ShipAddr` Line1–Line5 | parsed | | ✅ |
| `commitments.ship_via` | `PrivateNote` | appended | | ✅ |
| `commitments.bill_to` | `PrivateNote` | appended | | ✅ |
| `commitments.payment_terms` | `SalesTermRef` | exact-name match | | ✅ |
| SOV lines | `Line[n]` `ItemBasedExpenseLineDetail` | `ItemRef` from `QBO_BUDGET_CODE_MAP.item` or `QBO_DEFAULT_ITEM` | | ✅ |
| project name | `Line[n].ClassRef` | auto-created Class | | ✅ |
| revised amount | lump-sum fallback (Qty 1) | when SOV empty | | ✅ |
| `status` = `void` | `POStatus = Closed` | not deleted | | ✅ |

### 5.3 QBO — Prime Contract → Invoice (A/R) (`syncPrimeContractToQBO`)

| SiteCommand field | QBO `Invoice` field | Transform | Req | Status |
|---|---|---|---|---|
| `prime_contracts.owner_client` | `CustomerRef.value` | resolve / auto-create | ✅ (422 if blank) | ✅ |
| `prime_contracts.contract_number` | `DocNumber` | String | | ✅ |
| `prime_contracts.start_date` | `TxnDate` | `?? today` | | ✅ |
| `prime_contracts.estimated_completion_date` | `DueDate` | omit if null | | ✅ |
| `prime_contracts.title` | `Line[0].Description` | direct | | ✅ |
| `prime_contracts.description` \|\| `title` | `CustomerMemo.value` | direct | | ✅ |
| `description`, `contractor`, `architect_engineer`, `default_retainage`, `executed`, `status` | `PrivateNote` | multi-line join | | ✅ |
| original + approved COs | `Line[0].Amount` / `UnitPrice` (Qty 1) | revised total | | ✅ |
| SOV lines | `Line[n]` `SalesItemLineDetail` | `ItemRef` from map or `QBO_DEFAULT_ITEM` | | ✅ |
| project name | `Line[n].ClassRef` | auto-created Class | | ✅ |
| `default_retainage` | negative "Retainage" item → `QBO_RETAINAGE_RECEIVABLE_ACCOUNT` | per-line withheld | | ✅ |
| SOV `materials_stored` | "Materials presently stored" line | dedicated line | | ✅ |
| `status` = `void` | Invoice → **void** | | | ✅ |

### 5.4 QBO — AP Invoice (commitment SOV billed-to-date) → Bill (`syncAPInvoiceToQBO`)

| SiteCommand field | QBO `Bill` field | Transform | Req | Status |
|---|---|---|---|---|
| `commitments.contract_company` | `VendorRef.value` | resolve / auto-create | ✅ (422 if blank) | ✅ |
| `commitments.number` | `DocNumber` | String | | ✅ |
| `commitments.title` | `PrivateNote` | direct | | ✅ |
| SOV `description` | `Line[n].Description` | lines where `billed_to_date > 0` | | ✅ |
| SOV `billed_to_date` | `Line[n].Amount` | `Number(...)` | | ✅ |
| SOV `qty` / `uom` / `unit_cost` | `Qty` / `UnitPrice` | when consistent | | ✅ |
| SOV `budget_code` | `AccountRef` / `ClassRef` | via `QBO_BUDGET_CODE_MAP` | | ✅ |
| `commitments.default_retainage` | negative retainage line | `billed × pct` | | ✅ |

> **Pre-flight:** requires ≥1 SOV line with `billed_to_date > 0` (else 422).

### 5.5 QBO — AR Invoice (prime SOV this-period) → Invoice (A/R) (`syncARInvoiceToQBO`)

| SiteCommand field | QBO `Invoice` field | Transform | Req | Status |
|---|---|---|---|---|
| `prime_contracts.owner_client` | `CustomerRef.value` | resolve / auto-create | ✅ (422 if blank) | ✅ |
| `prime_contracts.contract_number` | `DocNumber` | String | | ✅ |
| `prime_contracts.title` | `PrivateNote` | direct | | ✅ |
| SOV `description` | `Line[n].Description` | lines where `work_completed_this_period > 0` | | ✅ |
| SOV `work_completed_this_period` | `Line[n].Amount` / `UnitPrice` (Qty 1) | `Number(...)` | | ✅ |
| SOV `budget_code` | `ClassRef` / `ItemRef` | via `QBO_BUDGET_CODE_MAP` | | ✅ |
| SOV per-line retainage | rolled-up negative retainage line | via "Retainage" item | | ✅ |
| SOV `materials_stored` | "Materials presently stored" line | summed | | ✅ |

> **Pre-flight:** requires ≥1 SOV line with `work_completed_this_period > 0` (else 422).

### 5.6 Sage — Commitment (subcontract or PO) → Purchase Order (`syncCommitmentToSage300Cre`)

| SiteCommand field | Agave `PurchaseOrder` field | Transform | Req | Status |
|---|---|---|---|---|
| `commitments.contract_company` | `vendor_id` | resolve by exact name (`GET /vendors`, case-insensitive); **fail-fast** | ✅ (422 if not found) | ✅ |
| `commitments.number` | `number` / `doc_number` | direct | | ✅ |
| `commitments.title` | `description` | direct | | ✅ |
| revised amount (orig + approved COs) | `amount` | `toFixed(2)` | | ✅ |
| `commitments.delivery_date` \|\| `estimated_completion_date` | `due_date` | YYYY-MM-DD | | ✅ |
| project → Sage job | `job_id` (header + per line) | `GET /jobs` by project number, then name; omit if unresolved | | ✅ |
| SOV `budget_code` → Sage cost code | `cost_code_id` (per line) | `GET /cost-codes?job_id=…` by code, then name; omit if unresolved | | ✅ |
| SOV `description` | line `description` | `"{budget_code} — {description}"` fallback | | ✅ |
| SOV `qty` × `unit_cost` ≈ `amount` | `quantity` / `unit_cost` / `unit_of_measure` | only when consistent | | ✅ |

### 5.7 Sage — AP Invoice (commitment SOV billed-to-date) → AP Invoice (`syncAPInvoiceToSage300Cre`)

| SiteCommand field | Agave `AP Invoice` field | Transform | Req | Status |
|---|---|---|---|---|
| `commitments.contract_company` | `vendor_id` | resolve by name; fail-fast | ✅ (422 if not found) | ✅ |
| `commitments.number` | `purchase_order_number` | reference to parent PO | | ✅ |
| SOV `billed_to_date > 0` | line `amount` | `Number(...)` per line | | ✅ |
| SOV `budget_code` | `cost_code_id` | same resolution as PO | | ✅ |
| project | `job_id` | same resolution as PO | | ✅ |
| `commitments.default_retainage` | `retention_amount` (header) | `billed × pct` | | ✅ |
| SOV `qty` / `unit_cost` / `uom` | `quantity` / `unit_cost` / `unit_of_measure` | when consistent | | ✅ |

### 5.8 Sage — Prime Contract → AR Invoice (`syncPrimeContractToSage300Cre`)

| SiteCommand field | Agave `AR Invoice` field | Transform | Req | Status |
|---|---|---|---|---|
| `prime_contracts.owner_client` | `customer_id` | resolve by name (`GET /customers`); fail-fast | ✅ (422 if not found) | ✅ |
| `prime_contracts.contract_number` | `number` | direct | | ✅ |
| `prime_contracts.title` | `description` | direct | | ✅ |
| revised amount | `amount` | `toFixed(2)` | | ✅ |
| `prime_contracts.estimated_completion_date` | `due_date` | YYYY-MM-DD | | ✅ |
| project | `job_id` | same resolution as PO | | ✅ |
| SOV `work_completed_this_period > 0` | line `amount` | per line | | ✅ |
| SOV per-line retainage | `retention_amount` (header) | rolled up | | ✅ |
| AR support | — | connector-dependent; Agave error surfaced in logs if `/ar-invoices` unsupported | | ⚠️ |

### 5.9 Vendor / Customer auto-enrichment (QBO, on create)

| `directory_contacts` field | QBO Vendor field | QBO Customer field |
|---|---|---|
| `company` | `CompanyName` | `CompanyName` |
| `email` | `PrimaryEmailAddr.Address` | `PrimaryEmailAddr.Address` |
| `phone` / `business_phone` | `PrimaryPhone.FreeFormNumber` | `PrimaryPhone.FreeFormNumber` |
| `business_fax` | `Fax.FreeFormNumber` | `Fax.FreeFormNumber` |
| `website` | `WebAddr.URI` | `WebAddr.URI` |
| `city`/`state`/`zip`/`country` | `BillAddr.{City,CountrySubDivisionCode,PostalCode,Country}` | `BillAddr.{…}` |

---

## 6. Budget Code Map (`QBO_BUDGET_CODE_MAP`)

Maps each SiteCommand budget code to QBO posting targets. Drives both **push** line coding and the **pull** of job-to-date costs.

### 6.1 Schema

```json
{
  "<budget_code>": { "account": "<account name>", "class": "<class name>", "item": "<item name>" }
}
```

All three fields are optional **individually**, but each entry must have **at least `account` or `item`** (Class alone is rejected on validation).

### 6.2 Validation rules (settings PATCH)

| Rule | Error (HTTP 400) |
|---|---|
| Must parse as JSON | `Budget code map must be valid JSON.` |
| Must be an object (not array) | `Budget code map must be a JSON object keyed by budget code.` |
| Keys must be non-empty after trim | `Budget codes cannot be blank.` |
| Each value must be an object | `Entry for "{code}" must be an object.` |
| Each field must be a string | `"{code}".{field} must be a string.` |

Empty field values are trimmed and dropped; entries with all fields empty are dropped entirely. The canonicalized JSON is stored.

### 6.3 Items-based vs account-based resolution

| Path | Map entry | Push line ref | Pull report | When to use |
|---|---|---|---|---|
| **Items-based (recommended, GC-standard)** | `item` set | `ItemRef` | `ProfitAndLossDetail?customer=…` aggregated by `item_name` | One QBO Item per budget code (e.g. `02-310.C` → Item `02-310.C`). |
| **Account-based (legacy)** | only `account` set | `AccountRef` | `ProfitAndLoss?classid=…` summed by leaf account | CoAs with one account per cost code. |

**Precedence:** if an entry sets both `item` and `account`, the **item** path wins for the pull. Both paths can run in the same resync (per-code). A shared target (one Item/Account mapped to >1 code) is **skipped as ambiguous**. Codes absent from the map get `0` in the pull result.

### 6.4 Example

```json
{
  "02-310.C": { "item": "02-310.C" },
  "03-100.C": { "item": "03-100.C", "class": "Sitework" },
  "09-900.M": { "account": "Cost of Goods Sold:Materials" }
}
```

---

## 7. Pull Direction — ERP → Budget (Job-to-Date Costs)

Triggered by **Resync with ERP** in the Budget tool → `POST /api/integrations/erp/resync-budget` `{ projectId }`. Writes `budget_line_items.job_to_date_costs` keyed by budget `cost_code`. Logs `record_type='budget_job_to_date'`.

| ERP | Path | Source | Project resolution | Code match |
|---|---|---|---|---|
| **QBO** items-based | `fetchQBOJobToDateCosts` → `pullByItem` | `reports/ProfitAndLossDetail?customer=…&accounting_method=Accrual&columns=tx_date,name,memo,item_name,subt_nat_amount`; walk leaf rows by `item_name` | `projects.qbo_customer_id` override first, else `findCustomerIdByName` (Projects-first via `IsProject=true`, then sub-customers, then plain Customers) | map `item` → code |
| **QBO** account-based | `fetchQBOJobToDateCosts` → `pullByAccount` | `reports/ProfitAndLoss?...&classid=…`; sum each leaf account row | project **Class** by name (`findClassIdByName`) | map `account` → code |
| **Sage** | `fetchSage300CreJobToDateCosts` | `GET /cost-codes?job_id=…`; probe actual field (`actual_cost`/`actual_amount`/`cost_to_date`/…) | `resolveSage300CreJobId` (project number, then name) | Sage cost code → budget code by code, then name |

No match / no class / no job → empty result + `warning` (never company-wide totals).

**Response:** `{ ok: true, erp: "quickbooks"|"sage300cre", matched: N, updated: N, warning?: string }`.

---

## 8. Accounting Feedback Schema (ERP → SiteCommand, read)

Populated three ways: (1) every push parses the create/update response; (2) manual `…/refresh`; (3) daily cron refresh pass (25 stalest per table per company). Added by **migration 161**.

### 8.1 `commitments` (AP side)

| Column | Type | Source |
|---|---|---|
| `qbo_vendor_id` | TEXT | resolved QBO Vendor Id |
| `qbo_total_amount` | NUMERIC(15,2) | header `TotalAmt` |
| `qbo_balance` | NUMERIC(15,2) | header `Balance` |
| `qbo_payment_status` | TEXT | `paid`/`partially_paid`/`unpaid` (Bill); `open`/`closed` (PO, from `POStatus`) |
| `qbo_ap_invoice_total_amount` | NUMERIC(15,2) | AP Bill `TotalAmt` |
| `qbo_ap_invoice_balance` | NUMERIC(15,2) | AP Bill `Balance` |
| `qbo_ap_invoice_payment_status` | TEXT | AP Bill status |
| `qbo_payments_refreshed_at` | TIMESTAMPTZ | last feedback read |
| `sage300cre_vendor_id` | TEXT | resolved Agave vendor id |
| `sage300cre_status` | TEXT | PO status (non-posting → status only) |
| `sage300cre_ap_invoice_total_amount` | NUMERIC(15,2) | AP invoice `amount` |
| `sage300cre_ap_invoice_amount_paid` | NUMERIC(15,2) | AP invoice `amount_paid` |
| `sage300cre_ap_invoice_balance` | NUMERIC(15,2) | AP invoice `balance` |
| `sage300cre_ap_invoice_status` | TEXT | AP invoice `status` |
| `sage300cre_payments_refreshed_at` | TIMESTAMPTZ | last feedback read |

### 8.2 `prime_contracts` (AR side)

| Column | Type | Source |
|---|---|---|
| `qbo_customer_id` | TEXT | resolved QBO Customer Id |
| `qbo_total_amount` / `qbo_balance` | NUMERIC(15,2) | header `TotalAmt` / `Balance` |
| `qbo_payment_status` | TEXT | `paid`/`partially_paid`/`unpaid` |
| `qbo_ar_invoice_total_amount` / `qbo_ar_invoice_balance` | NUMERIC(15,2) | AR Invoice `TotalAmt` / `Balance` |
| `qbo_ar_invoice_payment_status` | TEXT | AR Invoice status |
| `qbo_payments_refreshed_at` | TIMESTAMPTZ | last feedback read |
| `sage300cre_customer_id` | TEXT | resolved Agave customer id |
| `sage300cre_total_amount` / `_amount_paid` / `_balance` / `_status` | NUMERIC(15,2)/TEXT | header AR invoice |
| `sage300cre_ar_invoice_total_amount` / `_amount_paid` / `_balance` / `_status` | NUMERIC(15,2)/TEXT | SOV-billing AR invoice |
| `sage300cre_payments_refreshed_at` | TIMESTAMPTZ | last feedback read |

---

## 9. Idempotency & Sync State

### 9.1 QBO (migration 113)

| Column (commitments) | Column (prime_contracts) | Purpose |
|---|---|---|
| `qbo_id` | `qbo_id` | header Bill/PO/Invoice Id |
| `qbo_sync_token` | `qbo_sync_token` | optimistic-lock `SyncToken` (re-fetched before every update) |
| `last_synced_at` | `last_synced_at` | last successful header push |
| `qbo_ap_invoice_id` + `_sync_token` + `_synced_at` | `qbo_ar_invoice_id` + `_sync_token` + `_synced_at` | SOV-billing doc |
| `updated_at` (trigger on UPDATE) | `updated_at` | dirty detection |

`commitment_sov_items.updated_at` (trigger) — drives AP/AR-invoice dirty detection.

**Update protocol (QBO):** when `qbo_id` exists → `GET {entity}/{id}` to read `SyncToken` → `POST {entity}?operation=update` with `sparse:true`. Missing record (deleted in QBO) → fall back to create.

### 9.2 Sage (migration 160)

| Column (commitments) | Column (prime_contracts) | Purpose |
|---|---|---|
| `sage300cre_id` | `sage300cre_id` | header PO / AR-invoice Id |
| `sage300cre_synced_at` | `sage300cre_synced_at` | last successful header push |
| `sage300cre_ap_invoice_id` + `_synced_at` | `sage300cre_ar_invoice_id` + `_synced_at` | SOV-billing doc |

**Update protocol (Sage):** no `SyncToken` — `PUT /{resource}/{id}`. A `404` (deleted in Sage) → fall back to create.

### 9.3 `erp_status` (UI badge)

`commitments.erp_status` / `prime_contracts.erp_status`: `not_synced` / `pending` / `synced`.

---

## 10. Database Schema Reference

### 10.1 `erp_sync_logs`

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | UUID | NO | `gen_random_uuid()` | PK |
| `record_type` | TEXT | NO | — | `commitments`/`prime_contracts`/`ap_invoice`/`ar_invoice`/`budget_job_to_date` |
| `record_id` | UUID | NO | — | local record id |
| `integration` | TEXT | NO | — | `quickbooks` / `sage300cre` |
| `result` | TEXT | NO | — | `success` / `error` |
| `sage_key` | TEXT | YES | NULL | ERP doc Id on success |
| `error_message` | TEXT | YES | NULL | full error string |
| `raw_response` | TEXT | YES | NULL | raw body, truncated to 8000 chars |
| `synced_at` | TIMESTAMPTZ | NO | `now()` | |

Index: `erp_sync_logs_record_idx (record_type, record_id, synced_at DESC)`.

### 10.2 Migration map

| Migration | Adds |
|---|---|
| `113_qbo_idempotency_columns.sql` | commitments + prime_contracts QBO sync columns; `updated_at` triggers on commitments + commitment_sov_items |
| `160_sage300cre_idempotency_columns.sql` | commitments + prime_contracts Sage sync columns |
| `161_erp_accounting_feedback_columns.sql` | all feedback columns (§8) for both ERPs |
| `163_project_qbo_customer_mapping.sql` | `projects.qbo_customer_id` (TEXT, explicit pull override), `projects.qbo_customer_name` (TEXT, UI label) |

---

## 11. Error Code Reference

### 11.1 QBO OAuth (redirect to `/settings/integrations?error=…`)

| Code | HTTP | Trigger | Resolution |
|---|---|---|---|
| `qbo_unauthorized` | 401 | no session | sign in |
| `qbo_forbidden` | 403 | not SA | use a Super Admin / Site Admin account |
| `qbo_no_company` | 422 | no `company_id` | account must belong to a company |
| `qbo_not_configured` | — | `QBO_CLIENT_ID` missing | enter app credentials in Settings |
| `qbo_other_erp_connected` | — | Sage connected | disconnect Sage first |
| `qbo_denied` (`&reason=`) | — | user declined Intuit consent | retry and approve |
| `qbo_invalid_callback` | — | missing `code`/`realmId`/`state` | retry the connect flow |
| `qbo_invalid_state` | — | CSRF nonce mismatch (>10 min, or cookie lost) | retry; complete within 10 min, allow cookies |
| `qbo_missing_app_creds` | — | clientId/secret absent at callback | re-enter app creds, reconnect |
| `qbo_token_exchange_failed` (`&reason=`) | — | Intuit token POST failed | check redirect URI matches portal verbatim |

### 11.2 QBO sync — validation (HTTP **422**, `validation: true`)

- `This commitment has no Contract Company, and QuickBooks requires a vendor on every {Bill|Purchase Order}. Edit the commitment, set the Contract Company, then sync again.`
- `This prime contract has no Owner/Client, and QuickBooks requires a customer on every Invoice. Edit the contract, set the Owner/Client, then sync again.`

### 11.3 QBO sync — configuration / resolution (HTTP **502** unless `validation`)

- `No QBO expense account found. Set QBO_AP_EXPENSE_ACCOUNT to a valid expense or COGS account.`
- `Could not resolve or create QBO vendor "{name}": {detail}`
- `Could not resolve or create QBO customer "{name}": {detail}`
- `Could not resolve or create a QBO item for the invoice line.`
- `no vendor name provided` · `no customer name provided`

QBO Fault parsing (`extractQBOError`): `Fault.Error[0].Detail` → `Fault.Error[0].Message` → `message` → `rawText[0..500]` → `Unknown QuickBooks error`.

### 11.4 Sage sync (HTTP **422**)

- `Vendor "{name}" was not found in Sage 300 CRE. Create the vendor in Sage 300 CRE first, then re-sync.`
- `Customer "{name}" was not found in Sage 300 CRE. Create the customer in Sage 300 CRE first, then re-sync.`

Agave error parsing (`extractAgaveError`): `message` → `error` → `detail` → `rawText[0..500]` → `Unknown Agave error`.

### 11.5 Sage connection (HTTP **422**)

- `Add your Agave Client ID and Client Secret first, then connect.`
- `QuickBooks Online is already connected. Only one ERP integration may be connected at a time — disconnect QuickBooks in Settings → Integrations first.`

### 11.6 Budget resync (`/api/integrations/erp/resync-budget`)

| Message | HTTP |
|---|---|
| `projectId is required` | 400 |
| `Project not found` | 404 |
| `Forbidden` (project belongs to another company) | 403 |
| `Both QuickBooks and Sage 300 CRE are connected. Only one ERP integration may be connected at a time — disconnect one in Settings → Integrations.` | 422 |
| `No ERP integration is connected. Connect QuickBooks Online or Sage 300 CRE in Settings → Integrations first.` | 422 |
| `Failed to load project: {error}. If this mentions a missing column, apply supabase/migrations/163_project_qbo_customer_mapping.sql.` | 500 |
| `No budget line items with a budget code to update.` | 200 (ok) |

### 11.7 Generic route errors

| Message | HTTP |
|---|---|
| `recordType and recordId are required` | 400 |
| `Invalid recordType. Must be commitments or prime_contracts` (refresh) | 400 |
| `Invalid recordType. Must be one of: commitments, prime_contracts, ap_invoice, ar_invoice` (sync) | 400 |
| `No company associated with this account` | 422 |
| `This {entity} has not been synced to QuickBooks yet.` | 422 |
| `QuickBooks Online is not connected. Connect in Settings → Integrations.` | 422 |
| `publicToken is required` (Sage exchange) | 400 |

> **Status convention:** `422` = actionable by the user (fix the record / config). `502` = QBO/Agave-side fault. `500` = SiteCommand/DB error (often a missing migration). `404` = record not found (PGRST116 → 404; other DB errors → 500 with the message).

---

## 12. Data Types, Formats & Precision

| Concern | Rule |
|---|---|
| **Money** | DB `NUMERIC(15,2)` → `Number(x.toFixed(2))`. Never send `null` — omit the field. |
| **Quantities** | DB `NUMERIC(15,4)` → QBO `Qty` (accepts ≤5 dp). |
| **Dates** | DB `DATE` → `YYYY-MM-DD`. Omit null date keys (never send `null`). |
| **DocNumber** | ≤ 21 chars (truncated). Unique per entity type per realm in QBO → use `QBO_DOC_NUMBER_PREFIX=project` to avoid collisions. |
| **Long text** | `PrivateNote` / `CustomerMemo` — no practical length cap. |
| **Refs (QBO)** | `*Ref` = `{ value: "<Id>" }` (preferred) or `{ name: "<DisplayName>" }` for lookups. Always post by **Id**. |
| **Currency** | No `CurrencyRef` → realm home currency. Multi-currency 🔭. |
| **Tax** | No `TxnTaxDetail`/`TaxCodeRef` → amounts treated as tax-exclusive. 🔭 |

---

## 13. Verification

| ERP | Offline check (mocked fetch, no creds/network) |
|---|---|
| QBO | `npx tsx scripts/qbo-integration-check.ts` |
| Sage 300 CRE | `npx tsx scripts/sage300cre-integration-check.ts` |

Run the relevant check after touching `lib/quickbooks.ts` or `lib/sage300cre.ts`.
