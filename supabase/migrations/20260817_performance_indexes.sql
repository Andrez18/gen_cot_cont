-- Performance indexes for frequently queried columns
-- Run this migration to add indexes that speed up common queries.

-- Index on payment_requests.user_id (used in payment history lookups)
CREATE INDEX IF NOT EXISTS idx_payment_requests_user_id
  ON public.payment_requests (user_id);

-- Index on payment_requests.status (used in admin payment list filtering)
CREATE INDEX IF NOT EXISTS idx_payment_requests_status
  ON public.payment_requests (status);

-- Index on subscriptions.user_id (used in subscription checks)
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id
  ON public.subscriptions (user_id);

-- Composite index for the most common payment query (user + status)
CREATE INDEX IF NOT EXISTS idx_payment_requests_user_status
  ON public.payment_requests (user_id, status);

-- Index on expense_records.user_id (used in expense listing)
CREATE INDEX IF NOT EXISTS idx_expense_records_user_id
  ON public.expense_records (user_id);

-- Index on expense_records.report_id (used to find unassigned records)
CREATE INDEX IF NOT EXISTS idx_expense_records_report_id
  ON public.expense_records (report_id);

-- Index on tools.user_id (used in tools listing)
CREATE INDEX IF NOT EXISTS idx_tools_user_id
  ON public.tools (user_id);
