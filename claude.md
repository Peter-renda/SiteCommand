# SiteCommand – Submittals Alignment Notes (April 17, 2026)

## Source Tutorials Reviewed
- Best Practices: Submittals
- Add a Related Item to a Submittal Package
- Add Submitter and Approvers to the Submittal Workflow
- Apply a Submittal Workflow Template to a Submittal
- Change the Ball in Court on a Submittal
- Close a Submittal
- Create a Submittal
- Create a Submittal Revision
- Delete a Submittal
- Distribute a Submittal
- Duplicate a Submittal
- Edit a Submittal

## Product Alignment Implemented
- Persisted workflow and delivery fields already present in the create UI:
  - approver
  - owner’s manual
  - package notes
  - confirmed/actual delivery dates
  - workflow steps
- Added support for related items to submittals so package-level/context linking can be represented.
- Added submittal lifecycle metadata:
  - distributed date/user
  - closed date/user
  - duplicate/revision lineage
- Changed delete behavior to soft-delete semantics (`is_deleted`, `deleted_at`, `deleted_by`) to align with recycle-bin style behavior.
- Added explicit action API for common Procore-like operations:
  - duplicate
  - create revision
  - close
  - distribute
  - change ball in court

## Behavior/Flow Alignment
- Create + Create and Send Email behavior remains supported.
- Edit updates now support all new workflow and delivery fields.
- Ball in Court changes are restricted to `draft` and `open` statuses.
- Close and Distribute now explicitly record lifecycle timestamps.
- Distribute supports “create revision upon distribution” behavior in a single action.
- Submittal listing/detail now excludes soft-deleted records by default.

## Follow-ups (Recommended)
- Add a dedicated workflow template model/table and template picker in create/edit.
- Add first-class related-item pickers for RFIs, Drawings, Specs, and Documents (instead of link-based objects).
- Add a Recycle Bin UI (restore flow) for soft-deleted submittals.
- Add permission-level enforcement at action level (admin vs standard) similar to Procore.

---

# Additional Submittals Alignment Notes (April 17, 2026)

## Tutorials Reviewed in this pass
- Edit a Submittal Response
- Forward a Submittal for Review
- Mark a Submittal as Private
- Perform Bulk Actions on Submittals
- Redistribute a Submittal
- Remove a Submitter or Approver from the Submittal Workflow

## Changes Implemented
- Added new submittal action handlers to support:
  - `mark_private` / `mark_public`
  - `edit_response` (with Ball in Court guard + forward-on-edit restriction)
  - `forward_for_review` (adds a reviewer workflow step and moves Ball in Court)
  - `redistribute` (updates distribution lifecycle metadata)
  - `remove_workflow_person` (removes workflow user and reindexes steps)
- Added a new bulk API endpoint for submittals:
  - `POST /api/projects/:id/submittals/bulk-actions`
  - Supports mark private/public, redistribute, change status, and soft-delete
- Updated Submittals list UI with row selection + bulk action controls:
  - bulk mark private/public
  - bulk redistribute
  - bulk delete (recycle-bin semantics)
- Updated Submittal detail workflow table to render real workflow steps and response metadata:
  - sent date
  - due date
  - returned date
  - response
  - comments
- Added detail-page buttons/flows for:
  - redistributing a submittal
  - toggling privacy
  - editing a workflow response
  - forwarding for review
  - removing workflow participants

## Known limitations (to address next)
- Forward-for-review currently prompts for a contact ID (no directory picker modal yet).
- Response edit/forward forms are prompt-based placeholders; add full modal UX.
- Email notification behavior for these new action flows is not yet wired in.

---

# Submittals Alignment Pass – Requested Tutorials (April 17, 2026)

## Tutorials reviewed
- Respond to a Forwarded Submittal as a Reviewer
- Respond to a Submittal as an Approver
- Set Up Submittal Schedule Calculations
- Upload and Submit a Submittal
- Use Bulk Actions > Apply Workflow in the Submittals Tool
- Use Bulk Actions > Delete in the Submittals Tool
- Use Bulk Actions > Edit in the Submittals Tool
- Use Bulk Actions > Retrieve in the Submittals Tool
- View a Submittal

## What was added/updated in SiteCommand
- Added submittal schedule calculation support in API create/update flows:
  - Inputs: required on-site date, lead time, design team review time, internal review time
  - Derived outputs: planned return date, planned internal review completed date, planned submit by date
  - Suggested dates: submitter due date and approver due date
- Added DB migration for new schedule calculation fields on submittals.
- Extended bulk action API support:
  - apply workflow (draft-only items without existing workflow)
  - edit (bulk field updates)
  - retrieve (restore soft-deleted submittals from recycle bin)
- Improved response flow behavior for workflow actions:
  - Forwarded reviewer responses now return Ball in Court back to the forwarding user.
  - Standard responses now advance Ball in Court to the next pending workflow step.
- Updated submittals list UX:
  - Added Items vs Recycle Bin toggle.
  - Added bulk Retrieve button for Recycle Bin.
  - Added bulk Apply Workflow and Bulk Edit actions (prompt-driven placeholder controls).

## Notes / remaining parity gaps
- Bulk Apply Workflow currently uses prompt-based input for first-step person and does not yet include template selection UI.
- Bulk Edit UI currently includes a narrow prompt-driven control (manager update) and should be expanded to full parity field coverage.
- Upload-and-submit and approver/reviewer response UX still uses simple prompt-based interactions in detail views; full modal parity remains recommended.

---

# RFI + Admin + Drawing Alignment Pass (April 17, 2026)

## Requested tutorial set (from provided URLs)
- Add a Multi-Tiered Location to an Item
- Add a Related Item to an RFI
- Add Assignees to an RFI as an Assignee on an RFI
- Apply Configurable Fieldsets to Projects
- Bulk Edit RFIs
- Choose an Official Response for an RFI
- Close an RFI
- Configure a Prefix and Starting Number for RFIs
- Configure Advanced Settings (RFIs)
- Copy a Configurable Fieldset
- Create a Change Event from an RFI
- Create a Correspondence Item from an RFI
- Create a Potential Change Order from an RFI
- Create an Instruction from an RFI
- Create an RFI
- Create and View an RFI Report
- Create Custom Sections
- Create New Configurable Fieldsets
- Create New Custom Fields
- Create or Link RFIs on a Drawing
- Create/Edit/Delete Saved Views for RFIs
- Customize Column Display in RFIs
- Delete a Response to an RFI
- Delete an RFI
- Delete Configurable Fieldsets

## Access note
- Direct fetch attempts to `v2.support.procore.com` were blocked in this environment (`403 Forbidden` at tunnel layer), so this pass used the tutorial topics/titles from the provided links and aligned SiteCommand functionality to those workflows where feasible.

## Implemented in this pass
- Added **official response support** for RFIs:
  - new `rfis.official_response_id` field
  - detail-page “Mark Official” checkbox now persists selection
  - official response badge displayed in response list
- Added **related items support** for RFIs:
  - new `rfis.related_items` JSONB field
  - RFI detail “Related Items” tab now supports add/remove and optional links
- Added **delete response** flow for RFIs:
  - new DELETE API for `rfi_responses`
  - permission check: response creator or RFI creator can delete
  - clears official response if deleted response was official
- Added **bulk edit RFIs** flow:
  - new bulk API endpoint for RFIs (`status`, `due_date`, optional assignees)
  - list-page multi-select + bulk controls to apply updates
- Extended RFI PATCH logic/history support for:
  - `official_response_id`
  - `related_items`

## Existing alignment already present in product
- Create RFI flow (draft/open)
- Close/Reopen RFI action
- Create Change Event from RFI shortcut
- Delete RFI action
- RFI report/export support via PDF export
- Column display customization in list view

## Remaining parity gaps / recommended next steps
- RFI prefix + starting number configuration (currently auto-increment only).
- Advanced settings for RFIs (tool-level project/company settings UI + persistence).
- Saved views management for RFIs (named filters/views, default view).
- Drawing-level link/create RFI workflow in Drawings tool.
- First-class “Create Correspondence/Instruction/Potential Change Order” one-click actions from RFI with deep integration.
- Admin company features for configurable fieldsets/custom fields/custom sections and fieldset application/copy/delete are not covered by this RFI-focused pass.
- Multi-tiered location picker integration is not yet implemented in RFI forms.
