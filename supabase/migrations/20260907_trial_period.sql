-- Periodo de prueba gratuito de 7 días
-- Agrega una columna trial_ends_at a la tabla subscriptions.
-- Cuando un usuario nuevo se registra sin pagar, se le asigna un trial
-- de 7 días. La suscripción se considera activa durante el trial.

ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ;

-- Función para iniciar el trial de un usuario
CREATE OR REPLACE FUNCTION start_user_trial(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO subscriptions (user_id, status, current_period_end, trial_ends_at)
  VALUES (p_user_id, 'active', NOW() + INTERVAL '7 days', NOW() + INTERVAL '7 days')
  ON CONFLICT (user_id) DO UPDATE SET
    trial_ends_at = NOW() + INTERVAL '7 days',
    current_period_end = NOW() + INTERVAL '7 days',
    status = 'active';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para verificar si un usuario está en trial
CREATE OR REPLACE FUNCTION is_user_in_trial(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_trial_end TIMESTAMPTZ;
BEGIN
  SELECT trial_ends_at INTO v_trial_end
  FROM subscriptions
  WHERE user_id = p_user_id;

  RETURN v_trial_end IS NOT NULL AND v_trial_end > NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
