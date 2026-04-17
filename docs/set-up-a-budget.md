# Set Up a Budget

There are two ways to add data in the project’s **Budget** tool:

1. **Manual entry** using **Create Budget Line Item** (already built).
2. **Import** using the budget import template.

## Option 1: Add budget line items manually

Click **Create Budget Line Item**, enter the line item details, and repeat until all budget data has been entered.

### Required manual-entry fields

- **Cost Code** (required)
- **Cost Type** (required)

> Note: SiteCommand treats **Cost Code + Cost Type** as a unique budget-code combination and blocks duplicates.

### GST line items

If you need to track GST as its own budget line:

1. Open the **Create** menu.
2. Click **GST Budget Line Item**.
3. Enter your dedicated GST cost code.
4. Confirm **Cost Type** is set to **Other** (or your custom tax type).
5. Save.

GST line items are tagged in the Budget table for easier review and reporting.

### Partial (unbudgeted) line items

Use **Create Budget Line Item** and enable **Partial budget line item** when a missing budget code combination appears after project work has started.

- Partial line items are created with **$0 Original Budget Amount**.
- They are marked with a **?** indicator in the table.
- You can move funds to/from them using budget changes/modifications.

## Option 2: Import budget line items with the template

1. Download the Excel import template.
2. Enter your budget data in the template.
3. Save the file.
4. Return to Procore and import the file.

### Important template requirements

Before adding line items, keep the following in mind:

- Keep the template headings exactly as provided.
- Keep the column order exactly as provided.
- Required columns for import are:
  - **Cost Code**
  - **Cost Type**
  - **Manual Calculation**

Enter values for **Cost Code** and **Cost Type**. For details on these dropdown options, see the **Importer Data Fields** tab.

For the **Description** column, leave it blank or provide one if your team uses descriptive labels.

For **Manual Calculation**, choose:

- **True**: You will manually enter a value in **Budget Amount**.
- **False**: Procore calculates **Budget Amount** after import based on **Unit Quantity**, **Unit of Measure**, and **Unit Cost**.

To apply advanced forecasting curves in the **Forecasting** tab, enter:

- Start date
- End date
- Forecast curve name

For additional guidance on the template, select **Need Help**.

## Import and confirm

1. Select the file to import.
2. Click **Import**.
3. Click **Confirm Import**.

The imported budget line items will appear in Procore.

## Review and adjust before locking

After import, review your budget carefully and make any needed adjustments before locking it to preserve **Original Budget Amounts**.

You can:

- Edit the **Original Budget Amount** to update either the calculation or the amount.
- Delete a line item by clicking the **x** at the far right of the row.
- Add missing line items with **Create Budget Line Item**.
- Update **Forecast to Complete** by clicking the dollar amount on each line item.

**Forecast to Complete** helps you:

- Estimate projected over/under by line item.
- Choose a per-item calculation method.
- Add forecasting notes.

## Lock the budget and track future changes

Once review and adjustments are complete, lock the budget.

After locking, make updates through **Change Orders** or **Budget Changes** so your team retains a clear historical record of changes and their impact on the original budget.

After the budget is locked, the **Create Budget Change** button appears.

> Note: Once a budget is locked, only users with **Admin** permissions can unlock it. They can choose to preserve or delete all Budget Changes.

## Adjust budget views, compare data, and export

Use the dropdown options at the top of the budget to:

- Switch between available views and table configurations.
- Open available budget snapshots.
- Change grouping and filters.
- Add comparison columns to analyze variance.

### Job to Date Costs visibility

The budget view includes:

- **Job to Date Costs** (source column)
- **Direct Costs** (calculated from Job to Date Costs and Commitments Invoiced)

Use these together when reviewing non-ERP project cost progress and variance trends.

A budget snapshot captures a frozen view of the budget at a point in time so you can review and analyze changes later.

You can export the budget to **PDF** or **CSV**. If you want current filtering and grouping applied, export to **PDF**.
