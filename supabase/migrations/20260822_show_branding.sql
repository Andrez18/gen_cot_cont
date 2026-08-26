-- Preferencia por usuario para mostrar u ocultar la marca
-- "Generado con CotiFactura" al pie de los documentos generados.
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS show_branding boolean NOT NULL DEFAULT true;
