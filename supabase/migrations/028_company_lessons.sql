CREATE TABLE company_lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  uploaded_by_name TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  row_count INTEGER DEFAULT 0,
  columns JSONB DEFAULT '[]',
  rows JSONB DEFAULT '[]'
);
