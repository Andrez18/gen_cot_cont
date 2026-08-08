-- =====================================================================
-- Ejecutar en el SQL Editor de Supabase.
-- Agrega la firma personal de cada usuario (antes era una sola imagen
-- estática /public/firma.png compartida por todos).
-- =====================================================================

-- Si la tabla user_settings ya existe (de una entrega anterior), esto no
-- la vuelve a crear; solo le agrega la columna de la firma.
create table if not exists user_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  provider_info jsonb not null default '{}'::jsonb,
  bank_info jsonb not null default '{}'::jsonb,
  client_info jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table user_settings enable row level security;

drop policy if exists "users manage own settings" on user_settings;
create policy "users manage own settings"
  on user_settings for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Path (no URL) dentro del bucket privado "signatures", ej:
-- "3f2c.../1719800000000.png". Se resuelve a una URL firmada al momento
-- de mostrarla, tanto en documentos nuevos como en el historial.
alter table user_settings add column if not exists signature_path text;

-- ---------------------------------------------------------------------
-- Bucket privado para las firmas
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('signatures', 'signatures', false)
on conflict (id) do nothing;

-- Cada usuario solo puede subir/leer/reemplazar/borrar su propia carpeta
-- (signatures/<user_id>/archivo.png).
drop policy if exists "users upload own signature" on storage.objects;
create policy "users upload own signature"
  on storage.objects for insert
  with check (
    bucket_id = 'signatures'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "users read own signature" on storage.objects;
create policy "users read own signature"
  on storage.objects for select
  using (
    bucket_id = 'signatures'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "users delete own signature" on storage.objects;
create policy "users delete own signature"
  on storage.objects for delete
  using (
    bucket_id = 'signatures'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
