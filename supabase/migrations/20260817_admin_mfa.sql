-- Tabla para almacenar la configuración 2FA/TOTP del administrador.
-- Solo hay una fila (id=1) porque solo hay un admin.
CREATE TABLE IF NOT EXISTS admin_mfa (
  id         int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  secret     text NOT NULL,
  enabled    boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- RLS: solo service role puede acceder (las rutas API usan service_role key)
ALTER TABLE admin_mfa ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role only"
  ON admin_mfa
  FOR ALL
  USING (true)
  WITH CHECK (true);
