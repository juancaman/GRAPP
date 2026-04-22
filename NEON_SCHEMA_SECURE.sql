-- SQL SCHEMA PARA NEON (PostgreSQL)
-- Para Rodríguez Conecta - Social Vecinal Seguro
-- Pega este código en el SQL Editor de tu proyecto Neon

-- ===== CREAR TABLA POSTS =====
CREATE TABLE IF NOT EXISTS posts (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    user_email VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('precios', 'seguridad', 'servicios', 'basural')),
    message TEXT NOT NULL,
    phone VARCHAR(20) NOT NULL,
    image_url TEXT,
    is_anonymous BOOLEAN DEFAULT false,
    is_verified BOOLEAN DEFAULT false,
    is_visible BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===== CREAR ÍNDICES =====
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_category ON posts(category);
CREATE INDEX IF NOT EXISTS idx_posts_is_visible ON posts(is_visible);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);

-- ===== CREAR TRIGGER PARA updated_at =====
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_posts_updated_at BEFORE UPDATE
    ON posts FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ===== DATA DE PRUEBA =====
INSERT INTO posts (user_id, user_email, category, message, phone, is_anonymous, is_verified)
VALUES
    ('clerk_user_1', 'juan@example.com', 'precios', '💰 Vendo verduras frescas del jardín. Entrego en General Rodríguez', '+54 9 1234567890', false, true),
    ('clerk_user_2', 'maria@example.com', 'seguridad', '🚨 Alerta: Corte de luz en cuadra sur esta noche de 22:00 a 06:00', '+54 9 0987654321', true, true),
    ('clerk_user_3', 'carlos@example.com', 'servicios', '🔧 Arreglo electrodomésticos. Llamo a domicilio sin cargo', '+54 9 1122334455', false, false),
    ('clerk_user_4', 'lucia@example.com', 'basural', '♻️ Avisos: Nueva canasta de reciclaje en la estación. Plásticos, vidrio, papel', '+54 9 5566778899', true, true)
ON CONFLICT DO NOTHING;

-- ===== VISTAS ÚTILES =====

-- Vista: Posts públicos y verificados
CREATE OR REPLACE VIEW posts_public AS
SELECT id, user_id, user_email, category, message, image_url, 
       is_anonymous, is_verified, created_at
FROM posts
WHERE is_visible = true
ORDER BY created_at DESC;

-- Vista: Posts sin mostrar teléfono (seguridad)
CREATE OR REPLACE VIEW posts_sanitized AS
SELECT id, user_id, user_email, category, message, image_url,
       is_anonymous, is_verified, created_at
FROM posts
WHERE is_visible = true;

-- ===== FUNCIONES ÚTILES =====

-- Función: Contar posts verificados por usuario
CREATE OR REPLACE FUNCTION count_verified_by_user(user_email_param VARCHAR)
RETURNS INT AS $$
SELECT COUNT(*)::INT
FROM posts
WHERE user_email = user_email_param AND is_verified = true;
$$ LANGUAGE SQL;

-- ===== QUERIES DE REFERENCIA =====

-- 1. Obtener todos los posts públicos (para feed)
-- SELECT id, user_id, user_email, category, message, image_url, 
--        is_anonymous, is_verified, created_at
-- FROM posts
-- WHERE is_visible = true
-- ORDER BY created_at DESC
-- LIMIT 100;

-- 2. Obtener posts de un usuario
-- SELECT * FROM posts
-- WHERE user_id = $1
-- ORDER BY created_at DESC;

-- 3. Eliminar post (validando ownership)
-- DELETE FROM posts
-- WHERE id = $1 AND user_id = $2;

-- 4. Verificar post (solo admin)
-- UPDATE posts
-- SET is_verified = true
-- WHERE id = $1;

-- 5. Ocultar post (solo admin)
-- UPDATE posts
-- SET is_visible = false
-- WHERE id = $1;

-- 6. Obtener estadísticas
-- SELECT category, COUNT(*) as total, SUM(CASE WHEN is_verified THEN 1 ELSE 0 END) as verified
-- FROM posts
-- WHERE is_visible = true
-- GROUP BY category;

-- ===== SEGURIDAD: RESTRICCIONES RLS (Row Level Security) =====
-- Para mayor seguridad, se pueden habilitar políticas RLS en Neon:

-- ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- CREATE POLICY "Public posts visible to all"
--   ON posts FOR SELECT
--   USING (is_visible = true);

-- CREATE POLICY "Users can insert own posts"
--   ON posts FOR INSERT
--   WITH CHECK (auth.uid()::text = user_id);

-- CREATE POLICY "Users can delete own posts"
--   ON posts FOR DELETE
--   USING (auth.uid()::text = user_id);

-- CREATE POLICY "Admins can update all"
--   ON posts FOR UPDATE
--   USING (auth.email() = 'ADMIN_EMAIL@domain.com');

-- ===== NOTAS IMPORTANTE =====
-- 1. El teléfono se almacena en VARCHAR(20) sin encripción (para MVP)
--    En producción, usa pgcrypto: ALTER TABLE posts ADD COLUMN phone_encrypted BYTEA;
-- 2. Usa índices en campos WHERE para optimizar queries
-- 3. Backups automáticos: Neon lo hace cada 24 horas
-- 4. Monitorea query performance en Neon Dashboard
