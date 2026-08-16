-- Ejecutar en el SQL Editor de Supabase.
-- Registro del consentimiento de tratamiento de datos personales
-- (Ley 1581 de 2012 - Habeas Data, Colombia), guardado al registrarse.

alter table user_settings
  add column if not exists policy_accepted_at timestamptz;
