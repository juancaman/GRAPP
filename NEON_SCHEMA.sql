-- ================================================
-- Rodríguez Conecta - Schema PostgreSQL (Neon)
-- Ejecutar en https://console.neon.tech/app/projects/[project]/sql-editor
-- ================================================

-- Crear tabla posts
CREATE TABLE IF NOT EXISTS posts (
    id BIGSERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    user_email VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    phone VARCHAR(20),
    image_url TEXT,
    is_anonymous BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT FALSE,
    is_visible BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Crear índices para performance
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_category ON posts(category);
CREATE INDEX IF NOT EXISTS idx_posts_is_visible ON posts(is_visible);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);

-- Insertar datos de prueba (OPCIONAL - puedes borrar después)
INSERT INTO posts (user_id, user_email, category, message, phone, is_verified, is_visible)
VALUES 
    (
        'user_demo_001',
        'demo@example.com',
        'precios',
        '🥛 Leche fresca a $80 el litro - Entregos sábados a la mañana en la estación de tren',
        '+54 9 1234 567890',
        true,
        true
    ),
    (
        'user_demo_002',
        'vecino@example.com',
        'seguridad',
        '🚨 Aviso: Se vieron personas sospechosas anoche cerca de la estación. Policía notificada.',
        NULL,
        false,
        true
    ),
    (
        'user_demo_003',
        'anon@example.com',
        'servicios',
        '🔧 Electricista con 20 años de experiencia. Trabajos en zona. Consultas sin cargo.',
        '+54 9 9876 543210',
        false,
        true
    ),
    (
        'user_demo_004',
        'basura@example.com',
        'basural',
        '🗑️ Heladera Samsung funcionando, gratis para quien la retire mañana a las 10',
        NULL,
        false,
        true
    );

-- ================================================
-- SCHEMA ALTERNATIVO CON ENCRIPTACIÓN (OPCIONAL)
-- ================================================

-- Si quieres encriptar teléfonos (requiere extensión pgcrypto):
-- CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Tabla con teléfono encriptado:
-- CREATE TABLE IF NOT EXISTS posts_encrypted (
--     id BIGSERIAL PRIMARY KEY,
--     user_id VARCHAR(255) NOT NULL,
--     user_email VARCHAR(255) NOT NULL,
--     category VARCHAR(50) NOT NULL,
--     message TEXT NOT NULL,
--     phone_encrypted BYTEA,  -- Encriptado
--     image_url TEXT,
--     is_anonymous BOOLEAN DEFAULT FALSE,
--     is_verified BOOLEAN DEFAULT FALSE,
--     is_visible BOOLEAN DEFAULT TRUE,
--     created_at TIMESTAMP DEFAULT NOW(),
--     updated_at TIMESTAMP DEFAULT NOW()
-- );

-- ================================================
-- VIEWS (OPCIONAL - para facilitar queries)
-- ================================================

-- Vista: Posts públicos (solo visibles)
CREATE OR REPLACE VIEW posts_public AS
    SELECT 
        id,
        user_email,
        category,
        message,
        image_url,
        is_anonymous,
        is_verified,
        created_at
    FROM posts
    WHERE is_visible = TRUE
    ORDER BY created_at DESC;

-- Vista: Posts sin teléfono (para views públicas)
CREATE OR REPLACE VIEW posts_sanitized AS
    SELECT 
        id,
        user_email,
        category,
        message,
        image_url,
        is_anonymous,
        is_verified,
        created_at
    FROM posts
    WHERE is_visible = TRUE
    ORDER BY created_at DESC;

-- ================================================
-- FUNCIONES (OPCIONAL - para lógica DB)
-- ================================================

-- Función: Incrementar verificados por usuario
CREATE OR REPLACE FUNCTION count_verified_by_user(p_user_id VARCHAR)
RETURNS INT AS $$
BEGIN
    RETURN (
        SELECT COUNT(*) FROM posts 
        WHERE user_id = p_user_id AND is_verified = TRUE
    );
END;
$$ LANGUAGE plpgsql;

-- Función: Timestamps automáticos
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Actualizar updated_at automáticamente
CREATE TRIGGER update_posts_updated_at
BEFORE UPDATE ON posts
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- ================================================
-- QUERIES ÚTILES PARA TESTING
-- ================================================

-- Ver todos los posts (admin)
-- SELECT * FROM posts ORDER BY created_at DESC;

-- Ver posts públicos
-- SELECT * FROM posts_public;

-- Ver posts por categoría
-- SELECT * FROM posts WHERE category = 'precios' AND is_visible = TRUE;

-- Ver posts de un usuario
-- SELECT * FROM posts WHERE user_id = 'user_demo_001';

-- Contar posts por categoría
-- SELECT category, COUNT(*) as cantidad FROM posts WHERE is_visible = TRUE GROUP BY category;

-- Ver posts sin teléfono
-- SELECT * FROM posts WHERE phone IS NULL;

-- Ver posts con teléfono
-- SELECT id, user_email, message, phone FROM posts WHERE phone IS NOT NULL;

-- Borrar todos los datos de prueba
-- DELETE FROM posts WHERE user_id LIKE 'user_demo_%';

-- ================================================
-- NOTAS DE SEGURIDAD
-- ================================================

-- 1. Row Level Security (RLS) - Opcional, requiere:
--    ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
--
-- 2. Encriptación de teléfonos - Para más seguridad
--
-- 3. Backups automáticos - Configurar en Neon Console
--
-- 4. Conexión solo desde API - No exponer CONNECTION_STRING
