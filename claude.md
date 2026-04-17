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
