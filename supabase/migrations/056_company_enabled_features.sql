-- ============================================================
-- Migration 056: Company-level feature flags
-- ============================================================
-- Adds an enabled_features column to companies so Site Command
-- admins can toggle individual tools on/off per account.
--
-- Tools: rfis, submittals, change-orders, schedule, daily-log,
--        documents, drawings, photos, tasks, bim, budget,
--        commitments, bid-management, estimating, prequalification,
--        punch-list, transmittals, meetings, specifications,
--        prime-contracts, scope-of-work, change-events, reporting,
--        directory, preconstruction
-- ============================================================

ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS enabled_features TEXT[] NOT NULL DEFAULT ARRAY[
    'rfis',
    'submittals',
    'change-orders',
    'schedule',
    'daily-log',
    'documents',
    'drawings',
    'photos',
    'tasks',
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
