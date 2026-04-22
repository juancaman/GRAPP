-- setup.sql - Schema PostgreSQL para Neon Database
-- "Rodríguez Conecta" - Tabla de Posts y Configuración
-- Ejecutar en Neon SQL Editor: https://console.neon.tech/app/projects

-- ===== TABLA PRINCIPAL: POSTS =====
CREATE TABLE IF NOT EXISTS posts (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,           -- Clerk user ID
    user_email VARCHAR(255) NOT NULL,         -- Email del usuario (para admin check)
    categoria VARCHAR(50) NOT NULL,           -- precios, seguridad, servicios, basural
    mensaje TEXT NOT NULL,                    -- Contenido del post (máx 500 en app)
    telefono VARCHAR(20) NOT NULL,            -- Teléfono de contacto (protegido en memoria en frontend)
    imagen_url TEXT,                          -- URL de imagen en ImgBB (opcional)
    es_anonimo BOOLEAN DEFAULT false,         -- ¿Post anónimo?
    is_verified BOOLEAN DEFAULT false,        -- ¿Verificado por admin?
    is_visible BOOLEAN DEFAULT true,          -- ¿Visible en feed público?
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ===== INDICES PARA PERFORMANCE =====
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_categoria ON posts(categoria);
CREATE INDEX idx_posts_is_visible ON posts(is_visible);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);

-- ===== TRIGGER PARA UPDATED_AT =====
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===== INSERTS DE EJEMPLO PARA TESTING =====

-- Post de prueba: Precios (visible)
INSERT INTO posts 
(user_id, user_email, categoria, mensaje, telefono, imagen_url, es_anonimo, is_verified, is_visible)
VALUES 
('user_test_001', 'test@example.com', 'precios', 'Se vende moto 150cc 2019 en buen estado. Más info por WhatsApp', '+54 9 11 1234-5678', 'https://i.ibb.co/example1.jpg', false, true, true),
('user_test_002', 'anonymous@example.com', 'seguridad', 'Cuidado: Hay un auto robado circulando por Belgrano', '+54 9 11 9876-5432', NULL, true, false, true),
('user_test_003', 'maria@example.com', 'servicios', 'Clases de guitarra online. Principiante a avanzado. Primera clase gratis!', '+54 9 11 5555-5555', 'https://i.ibb.co/example2.jpg', false, false, true),
('user_test_004', 'admin@example.com', 'basural', 'Se requiere piloto para recolectar en zona norte. Contactar!', '+54 9 11 7777-7777', NULL, false, true, true);

-- ===== QUERIES DE REFERENCIA =====

-- Obtener posts visibles (público - lo que ve cualquier usuario)
-- SELECT id, user_id, user_email, categoria, mensaje, imagen_url, es_anonimo, is_verified, created_at
-- FROM posts
-- WHERE is_visible = true
-- ORDER BY created_at DESC
-- LIMIT 100;

-- Obtener todos los posts (admin solo)
-- SELECT * FROM posts ORDER BY created_at DESC LIMIT 500;

-- Crear nuevo post
-- INSERT INTO posts 
-- (user_id, user_email, categoria, mensaje, telefono, imagen_url, es_anonimo, is_verified, is_visible)
-- VALUES ('user_123', 'user@example.com', 'precios', 'Mi mensaje aquí', '1234567890', NULL, false, false, true)
-- RETURNING id, user_id, categoria, mensaje, created_at;

-- Eliminar post (solo si es propietario - backend valida con user_id)
-- DELETE FROM posts WHERE id = $1 AND user_id = $2 RETURNING id;

-- Marcar como verificado (admin)
-- UPDATE posts SET is_verified = true WHERE id = $1 RETURNING id;

-- Cambiar visibilidad (admin)
-- UPDATE posts SET is_visible = false WHERE id = $1 RETURNING id;

-- Obtener posts por categoría
-- SELECT * FROM posts WHERE categoria = 'seguridad' AND is_visible = true ORDER BY created_at DESC;

-- Obtener posts del usuario (para perfil)
-- SELECT * FROM posts WHERE user_id = $1 ORDER BY created_at DESC;

-- ===== ESTADÍSTICAS =====

-- Contar posts por categoría
-- SELECT categoria, COUNT(*) as total FROM posts WHERE is_visible = true GROUP BY categoria;

-- Posts sin verificar (admin)
-- SELECT id, user_email, categoria, mensaje, created_at FROM posts WHERE is_verified = false ORDER BY created_at;

-- Posts ocultos (admin)
-- SELECT id, user_email, categoria, mensaje, is_visible FROM posts WHERE is_visible = false;

-- ===== LIMPIEZA (OPCIONAL) =====

-- Para limpiar la tabla de pruebas:
-- DELETE FROM posts;
-- ALTER SEQUENCE posts_id_seq RESTART WITH 1;

-- ===== POLÍTICAS DE ROW LEVEL SECURITY (RLS) - OPCIONAL =====
-- Si deseas usar RLS en lugar de validación en backend:

-- ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- -- Los usuarios no autenticados ven solo posts visibles
-- CREATE POLICY "posts_visible_public" ON posts
--   FOR SELECT
--   USING (is_visible = true);

-- -- Los usuarios autenticados pueden ver todos los posts
-- CREATE POLICY "posts_all_authenticated" ON posts
--   FOR SELECT
--   USING (auth.role() = 'authenticated');

-- -- Los usuarios pueden eliminar solo sus propios posts
-- CREATE POLICY "delete_own_posts" ON posts
--   FOR DELETE
--   USING (user_id = (SELECT user_id FROM auth.users WHERE id = auth.uid()));

-- -- Solo admin puede hacer UPDATE
-- CREATE POLICY "admin_update_posts" ON posts
--   FOR UPDATE
--   USING (
--     (SELECT email FROM auth.users WHERE id = auth.uid()) = 'admin@example.com'
--   );
