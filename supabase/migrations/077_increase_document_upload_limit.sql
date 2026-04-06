-- Increase file size limit on project-documents bucket to 250 MB
-- to support large PDF uploads (e.g. construction drawings ~115 MB).
UPDATE storage.buckets
SET file_size_limit = 262144000   -- 250 * 1024 * 1024
WHERE id = 'project-documents';
