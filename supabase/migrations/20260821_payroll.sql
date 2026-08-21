-- Nómina de trabajadores.
-- Dos tablas:
--   payroll_employees: catálogo de trabajadores de cada usuario (tarifas por
--     hora, día, quincena, mes u obra/tarea).
--   payroll_runs: cada liquidación de nómina generada (una fila por periodo),
--     con el detalle por trabajador congelado en la columna `lines` (jsonb),
--     igual que hacen quotations/invoices con sus ítems.
-- Ejecutar en el SQL Editor de Supabase.

-- ============================================================
-- 1) TRABAJADORES
-- ============================================================
CREATE TABLE IF NOT EXISTS payroll_employees (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name       text NOT NULL,
  document_number text,
  position        text,
  -- Cómo se pactó el pago: mensual | quincenal | diario | por hora | por tarea/obra
  payment_type    text NOT NULL CHECK (payment_type IN ('monthly','biweekly','daily','hourly','per_task')),
  monthly_salary  numeric(14,2),
  weekly_rate     numeric(14,2),
  daily_rate      numeric(14,2),
  hourly_rate     numeric(14,2),
  task_rate       numeric(14,2),
  -- Si le corresponde auxilio de transporte (se valida contra el tope de 2 SMLMV al calcular)
  transport_aux   boolean NOT NULL DEFAULT true,
  -- Descuentos de seguridad social: se pueden apagar cuando el trabajador
  -- ya tiene EPS/AFP cubierta por otra parte (p. ej. independiente o pensionado)
  deduct_health   boolean NOT NULL DEFAULT true,
  deduct_pension  boolean NOT NULL DEFAULT true,
  active          boolean NOT NULL DEFAULT true,
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE payroll_employees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own employees"
  ON payroll_employees FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own employees"
  ON payroll_employees FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own employees"
  ON payroll_employees FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own employees"
  ON payroll_employees FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_payroll_employees_user
  ON payroll_employees (user_id, created_at DESC);

-- ============================================================
-- 2) LIQUIDACIONES DE NÓMINA
-- ============================================================
CREATE TABLE IF NOT EXISTS payroll_runs (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  number           text NOT NULL,
  -- Nombre visible de la liquidación (editable por el usuario);
  -- si viene vacío la app muestra el código number.
  name             text,
  period_start     date NOT NULL,
  period_end       date NOT NULL,
  period_label     text,
  company_name     text,
  company_nit      text,
  employee_count   integer NOT NULL DEFAULT 0,
  total_devengados numeric(14,2) NOT NULL DEFAULT 0,
  total_deducciones numeric(14,2) NOT NULL DEFAULT 0,
  total_neto       numeric(14,2) NOT NULL DEFAULT 0,
  -- Detalle congelado por trabajador (mismas formas de cálculo que se muestran)
  lines            jsonb NOT NULL DEFAULT '[]'::jsonb,
  notes            text,
  created_at       timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE payroll_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payroll runs"
  ON payroll_runs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own payroll runs"
  ON payroll_runs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own payroll runs"
  ON payroll_runs FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_payroll_runs_user
  ON payroll_runs (user_id, created_at DESC);
  
-- Si ya habías ejecutado esta migración antes de la actualización, estas
-- líneas agregan las columnas nuevas sin tocar los datos existentes:
ALTER TABLE payroll_employees ADD COLUMN IF NOT EXISTS weekly_rate      numeric(14,2);
ALTER TABLE payroll_employees ADD COLUMN IF NOT EXISTS deduct_health  boolean NOT NULL DEFAULT true;
ALTER TABLE payroll_employees ADD COLUMN IF NOT EXISTS deduct_pension boolean NOT NULL DEFAULT true;
ALTER TABLE payroll_runs       ADD COLUMN IF NOT EXISTS name text;
