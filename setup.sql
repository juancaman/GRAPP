-- setup.sql - Schema PostgreSQL para Neon Database
-- Rodríguez Conecta - Aplicación social de barrio
-- Ejecutar en: https://console.neon.tech/app/projects

-- ========================================
-- TABLA PRINCIPAL: POSTS
-- ========================================
CREATE TABLE IF NOT EXISTS posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,                      -- Clerk user ID
    user_name TEXT NOT NULL,                    -- Nombre mostrado (email sin @)
    user_email TEXT NOT NULL,                   -- Email del usuario (para admin check)
    category TEXT NOT NULL,                     -- 'precios', 'seguridad', 'servicios', 'basural'
    message TEXT NOT NULL,                      -- Contenido del aviso (máx 500 chars)
    phone TEXT NOT NULL,                        -- Teléfono protegido en backend
    image_url TEXT,                             -- URL de imagen en ImgBB (opcional)
    is_visible BOOLEAN DEFAULT true,            -- Visible en feed público
    is_verified BOOLEAN DEFAULT false,          -- Marcado como verificado por admin
    created_at TIMESTAMPTZ DEFAULT NOW(),       -- Timestamp automático
    updated_at TIMESTAMPTZ DEFAULT NOW()        -- Para futuras actualizaciones
);

-- ========================================
-- ÍNDICES PARA PERFORMANCE
-- ========================================
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_category ON posts(category);
CREATE INDEX IF NOT EXISTS idx_posts_is_visible ON posts(is_visible);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);

-- ========================================
-- TRIGGER PARA UPDATED_AT
-- ========================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- DATOS DE EJEMPLO (Opcional)
-- ========================================
-- INSERT INTO posts (user_id, user_name, user_email, category, message, phone, is_verified)
-- VALUES 
-- ('clerk_user_1', 'juan', 'juan@example.com', 'precios', 'Se vende bicicleta en buen estado', '+54 9 11 1234-5678', true),
-- ('clerk_user_2', 'maria', 'maria@example.com', 'seguridad', 'Cuidado: perro suelto en zona norte', '+54 9 11 9876-5432', false),
-- ('clerk_user_3', 'carlos', 'carlos@example.com', 'servicios', 'Clases de guitarra online', '+54 9 11 5555-5555', false);

-- ========================================
-- COMENTARIOS DE SEGURIDAD
-- ========================================
-- 
-- 1. PHONE FIELD
--    El teléfono se guarda en texto plano en la BD.
--    NUNCA se expone en la API pública sin autenticación.
--    Acceso protegido: solo en endpoint GET (/api?get=all_posts) para admin.
--
-- 2. OWNERSHIP VALIDATION
--    Eliminar post: Validación en backend WHERE user_id = $2
--    Admin actions: Email verificado en backend (no en BD)
--
-- 3. VISIBILITY CONTROL
--    is_visible = false → No aparece en feed público
--    is_visible = true → Visible en GET /api?get=posts (público)
--
-- 4. VERIFICATION
--    is_verified = true → Muestra checkmark ✓ en UI
--    Admin puede marcar/desmarcar posts
--
-- ========================================
-- QUERIES DE REFERENCIA
-- ========================================

-- Obtener posts públicos visibles (lo que ve cualquier usuario)
-- SELECT id, user_id, user_name, category, message, image_url, created_at, is_verified
-- FROM posts
-- WHERE is_visible = true
-- ORDER BY created_at DESC
-- LIMIT 50;

-- Obtener todos los posts (admin)
-- SELECT * FROM posts ORDER BY created_at DESC;

-- Estadísticas: Posts última semana
-- SELECT COUNT(*) as weekly_count
-- FROM posts
-- WHERE created_at >= NOW() - INTERVAL '7 days' AND is_visible = true;

-- Estadísticas: Total posts
-- SELECT COUNT(*) as total_count
-- FROM posts
-- WHERE is_visible = true;

-- Eliminar post (validación ownership en backend)
-- DELETE FROM posts WHERE id = $1 AND user_id = $2;

-- Toggle visibility (admin)
-- UPDATE posts SET is_visible = $1 WHERE id = $2;

-- Posts por categoría
-- SELECT * FROM posts WHERE category = 'seguridad' AND is_visible = true;

-- ========================================
-- LIMPIEZA (Para testing)
-- ========================================
-- Para resetear la tabla:
-- DELETE FROM posts;
-- TRUNCATE posts CASCADE;
-- DROP TABLE IF EXISTS posts CASCADE;

-- ========================================
-- ROLLBACK (Si algo sale mal)
-- ========================================
-- DROP TRIGGER IF EXISTS update_posts_updated_at ON posts;
-- DROP FUNCTION IF EXISTS update_updated_at_column();
-- DROP TABLE IF EXISTS posts;
