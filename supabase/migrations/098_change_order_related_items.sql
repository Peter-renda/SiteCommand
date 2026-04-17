-- Related Items tab on change order (CCO) detail page

CREATE TABLE IF NOT EXISTS change_order_related_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  change_order_id UUID NOT NULL REFERENCES change_orders(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL DEFAULT '',
  item_id TEXT NULL,
  item_label TEXT NULL,
  item_date DATE NULL,
  notes TEXT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_by UUID NULL REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS change_order_related_items_change_order_id_idx
  ON change_order_related_items(change_order_id, sort_order ASC, created_at ASC);

CREATE INDEX IF NOT EXISTS change_order_related_items_project_id_idx
  ON change_order_related_items(project_id);
