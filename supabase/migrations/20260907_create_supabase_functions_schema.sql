-- Crear esquema supabase_functions necesario para Database Webhooks
CREATE SCHEMA IF NOT EXISTS supabase_functions;

-- Otorgar permisos al role anon y service_role
GRANT USAGE ON SCHEMA supabase_functions TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA supabase_functions TO anon, authenticated, service_role;
