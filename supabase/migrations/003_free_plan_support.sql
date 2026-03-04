-- ============================================================
-- Migration 003: Free plan support
-- ============================================================
-- 1. Make stripe_customer_id nullable: free users don't have one
--    until they attempt their first checkout.
-- 2. Add 'free' to the plan CHECK constraint.
-- 3. (PostgreSQL allows multiple NULLs in a UNIQUE column, so
--    the UNIQUE constraint on stripe_customer_id is kept but
--    the NOT NULL constraint is removed.)
-- ============================================================

-- Allow NULL stripe_customer_id (free plan users start without one)
ALTER TABLE subscriptions
  ALTER COLUMN stripe_customer_id DROP NOT NULL;

-- Drop the old plan CHECK constraint and recreate with 'free'
ALTER TABLE subscriptions
  DROP CONSTRAINT IF EXISTS subscriptions_plan_check;

ALTER TABLE subscriptions
  ADD CONSTRAINT subscriptions_plan_check
  CHECK (plan IN ('free', 'monthly', 'annual'));
