-- 1. Tabla de préstamos a trabajadores
CREATE TABLE IF NOT EXISTS worker_loans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  worker_name TEXT NOT NULL,
  amount NUMERIC(14,2) NOT NULL,
  loan_date DATE NOT NULL DEFAULT CURRENT_DATE,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid')),
  paid_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE worker_loans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_manage_own_loans"
  ON worker_loans
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_worker_loans_user_id ON worker_loans(user_id);

-- 2. Campo can_use_loans en user_settings
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS can_use_loans BOOLEAN DEFAULT false;
