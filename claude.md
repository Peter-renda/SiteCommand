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
