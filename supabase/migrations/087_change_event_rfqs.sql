-- Change Event RFQs sent from Quick Actions → Send RFQs

CREATE TABLE IF NOT EXISTS change_event_rfqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT '',
  due_date DATE NULL,
  request_details TEXT NULL,
  distribution_contact_id UUID NULL REFERENCES directory_contacts(id) ON DELETE SET NULL,
  distribution_name TEXT NULL,
  distribution_email TEXT NULL,
  change_event_ids UUID[] NOT NULL DEFAULT '{}',
  created_by UUID NULL REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS change_event_rfq_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rfq_id UUID NOT NULL REFERENCES change_event_rfqs(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  change_event_id UUID NULL REFERENCES change_events(id) ON DELETE SET NULL,
  change_event_line_item_id UUID NULL REFERENCES change_event_line_items(id) ON DELETE SET NULL,
  commitment_id UUID NULL REFERENCES commitments(id) ON DELETE SET NULL,
  contract_company TEXT NULL,
  contract_number TEXT NULL,
  scope_description TEXT NULL,
  recipient_contact_id UUID NULL REFERENCES directory_contacts(id) ON DELETE SET NULL,
  recipient_name TEXT NULL,
  recipient_email TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS change_event_rfqs_project_id_idx
  ON change_event_rfqs(project_id, created_at DESC);

CREATE INDEX IF NOT EXISTS change_event_rfq_recipients_rfq_id_idx
  ON change_event_rfq_recipients(rfq_id);

CREATE INDEX IF NOT EXISTS change_event_rfq_recipients_recipient_contact_id_idx
  ON change_event_rfq_recipients(recipient_contact_id);
