-- Tabla para notificaciones persistentes de la aplicación.
-- Las notificaciones se crean en el servidor (ej: pago aprobado/rechazado)
-- y se muestran al usuario en un centro de notificaciones.
CREATE TABLE IF NOT EXISTS notifications (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type       text NOT NULL CHECK (type IN ('info', 'success', 'warning', 'error')),
  title      text NOT NULL,
  message    text NOT NULL DEFAULT '',
  read       boolean NOT NULL DEFAULT false,
  link       text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS: cada usuario solo ve sus propias notificaciones
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see their own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can mark their notifications as read"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Index para queries frecuentes
CREATE INDEX IF NOT EXISTS idx_notifications_user_read
  ON notifications (user_id, read, created_at DESC);
