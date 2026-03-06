-- Backfill company records for admin users who either:
-- (a) have a company name in the old text field but no company_id, or
-- (b) have a company_id that no longer matches any companies record

DO $$
DECLARE
    r RECORD;
    new_company_id UUID;
BEGIN
    -- Case A: admin users with company text but company_id IS NULL
    FOR r IN
        SELECT id, company
        FROM users
        WHERE company IS NOT NULL
          AND company != ''
          AND company_role = 'admin'
          AND company_id IS NULL
    LOOP
        INSERT INTO companies (name, subscription_status, seat_limit)
        VALUES (r.company, 'active', 10)
        RETURNING id INTO new_company_id;

        UPDATE users
        SET company_id = new_company_id
        WHERE id = r.id;
    END LOOP;

    -- Case B: admin users with a company_id that doesn't exist in companies table
    FOR r IN
        SELECT u.id, u.company, u.company_id
        FROM users u
        LEFT JOIN companies c ON c.id = u.company_id
        WHERE u.company_id IS NOT NULL
          AND c.id IS NULL
          AND u.company_role = 'admin'
    LOOP
        INSERT INTO companies (name, subscription_status, seat_limit)
        VALUES (COALESCE(r.company, 'My Company'), 'active', 10)
        RETURNING id INTO new_company_id;

        UPDATE users
        SET company_id = new_company_id
        WHERE id = r.id;
    END LOOP;
END $$;

-- Fix companies created via the new signup flow that still have the default seat_limit=0.
-- These are real companies (have at least one admin user) but were never given a seat limit.
UPDATE companies
SET seat_limit = 10,
    subscription_status = 'active'
WHERE seat_limit = 0
  AND id IN (
      SELECT DISTINCT company_id
      FROM users
      WHERE company_role = 'admin'
        AND company_id IS NOT NULL
  );
