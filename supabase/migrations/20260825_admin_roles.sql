-- Administradores adicionales gestionables desde el panel.
-- El admin "propietario" sigue siendo ADMIN_EMAIL (env) y no se puede
-- quitar desde la app; esta tabla guarda los admins extra que el
-- propietario asigna. Solo el backend (service_role, bypassa RLS)
-- consulta o modifica esta tabla: no se crean políticas para
-- anon/authenticated a propósito.

create table if not exists public.admin_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  email text not null unique,
  granted_by text,
  created_at timestamptz not null default now()
);

alter table public.admin_roles enable row level security;

create index if not exists idx_admin_roles_email
  on public.admin_roles (email);
