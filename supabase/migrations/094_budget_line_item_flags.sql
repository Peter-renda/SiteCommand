-- Add workflow flags to support special budget line item behaviors.
-- is_partial_line_item: line item was added as a partial/unbudgeted line item.
-- is_gst_line_item: line item represents GST and defaults to the 'Other' cost type.

ALTER TABLE budget_line_items
  ADD COLUMN IF NOT EXISTS is_partial_line_item BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_gst_line_item BOOLEAN NOT NULL DEFAULT false;
