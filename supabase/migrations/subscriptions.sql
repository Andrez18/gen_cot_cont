-- Ejecutar en el SQL Editor de Supabase

create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  status text not null default 'inactive', -- inactive | active
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists payment_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  user_email text not null,
  amount integer not null,
  reference_number text not null,
  status text not null default 'pending', -- pending | approved | rejected
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by text
);

alter table subscriptions enable row level security;
alter table payment_requests enable row level security;

-- El usuario solo ve su propia suscripcion.
create policy "users read own subscription"
  on subscriptions for select
  using (auth.uid() = user_id);

-- El usuario puede registrar un pago propio (queda en pending) y ver su historial.
create policy "users read own payment requests"
  on payment_requests for select
  using (auth.uid() = user_id);

create policy "users insert own payment requests"
  on payment_requests for insert
  with check (auth.uid() = user_id and status = 'pending');

-- No hay policy de update para usuarios: aprobar/rechazar y activar la
-- suscripcion solo lo hacen las rutas /api/admin/* usando la service_role key.
