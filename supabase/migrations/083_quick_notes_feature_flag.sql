-- ============================================================
-- Migration 083: Add Quick Notes to company feature flags
-- ============================================================
-- 1) Update default enabled_features for newly created companies
-- 2) Backfill existing companies that use explicit feature arrays
-- ============================================================

ALTER TABLE companies
  ALTER COLUMN enabled_features SET DEFAULT ARRAY[
    'rfis',
    'submittals',
    'change-orders',
    'schedule',
    'daily-log',
    'documents',
    'drawings',
    'photos',
    'tasks',
    'quick-notes',
    'bim',
    'budget',
    'commitments',
    'bid-management',
    'estimating',
    'prequalification',
    'punch-list',
    'transmittals',
    'meetings',
    'specifications',
    'prime-contracts',
    'scope-of-work',
    'change-events',
    'reporting',
    'directory',
    'preconstruction'
  ];

UPDATE companies
SET enabled_features = array_append(enabled_features, 'quick-notes')
WHERE enabled_features IS NOT NULL
  AND NOT ('quick-notes' = ANY(enabled_features));
