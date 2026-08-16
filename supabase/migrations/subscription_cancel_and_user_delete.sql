-- =====================================================================
-- Ejecutar en el SQL Editor de Supabase DESPUÉS de subscriptions.sql y
-- payments_security_and_discounts.sql.
-- Agrega: cancelación de suscripción por el usuario, y borrado en
-- cascada de los datos de un usuario cuando el admin lo elimina.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) Registro de cuándo se canceló una suscripción (informativo).
-- ---------------------------------------------------------------------
alter table subscriptions
  add column if not exists canceled_at timestamptz;

-- ---------------------------------------------------------------------
-- 2) Función para que el propio usuario cancele su suscripción activa.
--    Se ejecuta con SECURITY DEFINER porque no hay policy de UPDATE
--    para usuarios (a propósito, ver subscriptions.sql), pero acá solo
--    se le permite tocar su propia fila y solo pasar de 'active' a
--    'canceled'.
-- ---------------------------------------------------------------------
create or replace function public.cancel_own_subscription()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update subscriptions
  set status = 'canceled',
      canceled_at = now(),
      updated_at = now()
  where user_id = auth.uid()
    and status = 'active';

  if not found then
    raise exception 'NO_ACTIVE_SUBSCRIPTION';
  end if;
end;
$$;

revoke all on function public.cancel_own_subscription() from public;
grant execute on function public.cancel_own_subscription() to authenticated;

-- ---------------------------------------------------------------------
-- 3) Borrado en cascada de los datos de un usuario. Se llama desde
--    /api/admin/users/delete con la service_role key, justo antes de
--    eliminar al usuario de auth.users. Cubre las tablas que tienen
--    user_id aunque no todas tengan "on delete cascade" configurado.
-- ---------------------------------------------------------------------
create or replace function public.delete_user_data(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from subscriptions where user_id = p_user_id;
  delete from payment_requests where user_id = p_user_id;
  delete from user_settings where user_id = p_user_id;

  -- Estas tablas existen en el proyecto pero no tienen migración en
  -- este repo; el "if" evita que la función falle si alguna no existe
  -- o no tiene columna user_id en algún entorno.
  if to_regclass('public.expense_records') is not null then
    execute 'delete from expense_records where user_id = $1' using p_user_id;
  end if;
  if to_regclass('public.expense_reports') is not null then
    execute 'delete from expense_reports where user_id = $1' using p_user_id;
  end if;
  if to_regclass('public.invoices') is not null then
    execute 'delete from invoices where user_id = $1' using p_user_id;
  end if;
  if to_regclass('public.quotations') is not null then
    execute 'delete from quotations where user_id = $1' using p_user_id;
  end if;
  if to_regclass('public.tools') is not null then
    execute 'delete from tools where user_id = $1' using p_user_id;
  end if;
end;
$$;

revoke all on function public.delete_user_data(uuid) from public;
grant execute on function public.delete_user_data(uuid) to service_role;
