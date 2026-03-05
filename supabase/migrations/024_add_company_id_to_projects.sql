ALTER TABLE projects ADD COLUMN company_id UUID REFERENCES companies(id);
