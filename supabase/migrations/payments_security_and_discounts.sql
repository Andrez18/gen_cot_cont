-- =====================================================================
-- Ejecutar en el SQL Editor de Supabase DESPUÉS de subscriptions.sql
-- Mejora la seguridad de la confirmación de pagos y agrega códigos
-- de descuento.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) Códigos de descuento
-- ---------------------------------------------------------------------
create table if not exists discount_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  type text not null check (type in ('percentage', 'fixed')),
  value numeric not null check (value > 0),
  max_uses integer,                          -- null = sin límite
  times_used integer not null default 0,
  active boolean not null default true,
  expires_at timestamptz,                    -- null = no expira
  created_at timestamptz not null default now(),
  created_by text
);

alter table discount_codes enable row level security;

-- Sin policies para anon/authenticated a propósito: los códigos solo se
-- leen/escriben desde las rutas /api/** usando la service_role key. Así
-- un usuario no puede listar ni fabricar el uso de un código leyendo la
-- tabla directamente con la anon key.

-- ---------------------------------------------------------------------
-- 2) Columnas nuevas en payment_requests (comprobante + descuento)
-- ---------------------------------------------------------------------
alter table payment_requests
  add column if not exists proof_path text,
  add column if not exists discount_code text references discount_codes (code),
  add column if not exists discount_amount integer not null default 0,
  add column if not exists final_amount integer;

update payment_requests set final_amount = amount where final_amount is null;
alter table payment_requests alter column final_amount set not null;

-- ---------------------------------------------------------------------
-- 3) Reglas anti-fraude a nivel de base de datos (respaldo de las
--    validaciones que ya hace la ruta /api/payments/submit)
-- ---------------------------------------------------------------------

-- Un mismo número de referencia no puede estar activo (pendiente o ya
-- aprobado) en más de una solicitud. Evita que dos personas reutilicen
-- el mismo comprobante de Nequi.
create unique index if not exists payment_requests_reference_active_idx
  on payment_requests (reference_number)
  where status in ('pending', 'approved');

-- Un usuario solo puede tener una solicitud pendiente a la vez.
create unique index if not exists payment_requests_one_pending_per_user_idx
  on payment_requests (user_id)
  where status = 'pending';

-- ---------------------------------------------------------------------
-- 4) Ya no se permite insertar pagos directo desde el cliente (RLS).
--    Ahora toda solicitud pasa por /api/payments/submit, que valida
--    formato, límites de intentos, comprobante y código de descuento
--    antes de insertar con la service_role key.
-- ---------------------------------------------------------------------
drop policy if exists "users insert own payment requests" on payment_requests;

-- ---------------------------------------------------------------------
-- 5) Funciones atómicas para canjear/liberar un código de descuento.
--    Se ejecutan en una sola sentencia UPDATE ... RETURNING, así que
--    dos solicitudes simultáneas no pueden "pasar" el mismo cupo.
-- ---------------------------------------------------------------------
create or replace function public.redeem_discount_code(p_code text)
returns table (id uuid, type text, value numeric)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_type text;
  v_value numeric;
begin
  update discount_codes
  set times_used = times_used + 1
  where code = upper(trim(p_code))
    and active = true
    and (expires_at is null or expires_at > now())
    and (max_uses is null or times_used < max_uses)
  returning discount_codes.id, discount_codes.type, discount_codes.value
    into v_id, v_type, v_value;

  if v_id is null then
    raise exception 'INVALID_CODE';
  end if;

  return query select v_id, v_type, v_value;
end;
$$;

create or replace function public.release_discount_code(p_code text)
returns void
language sql
security definer
set search_path = public
as $$
  update discount_codes
  set times_used = greatest(times_used - 1, 0)
  where code = upper(trim(p_code));
$$;

revoke all on function public.redeem_discount_code(text) from public;
revoke all on function public.release_discount_code(text) from public;
grant execute on function public.redeem_discount_code(text) to service_role;
grant execute on function public.release_discount_code(text) to service_role;

-- ---------------------------------------------------------------------
-- 6) Bucket privado para las fotos del comprobante de pago
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('payment-proofs', 'payment-proofs', false)
on conflict (id) do nothing;

-- Cada usuario solo puede subir/leer dentro de su propia carpeta
-- (payment-proofs/<user_id>/archivo.jpg). El admin lee cualquier
-- comprobante desde la ruta /api/admin/payments/proof usando la
-- service_role key (que ignora RLS).
drop policy if exists "users upload own payment proofs" on storage.objects;
create policy "users upload own payment proofs"
  on storage.objects for insert
  with check (
    bucket_id = 'payment-proofs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "users read own payment proofs" on storage.objects;
create policy "users read own payment proofs"
  on storage.objects for select
  using (
    bucket_id = 'payment-proofs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
