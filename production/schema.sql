-- ============================================
-- SQL Schema para Rodríguez Conecta
-- Base de Datos: Neon PostgreSQL
-- 
-- Instrucciones:
-- 1. Ve a https://console.neon.tech
-- 2. Abre tu proyecto y editor SQL
-- 3. Copia TODO este archivo
-- 4. Pega en el editor SQL
-- 5. Ejecuta (ejecutar)
-- ============================================

-- Tabla principal de posts/avisos
CREATE TABLE IF NOT EXISTS posts (
    id SERIAL PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    phone VARCHAR(20) NOT NULL,
    category VARCHAR(20) NOT NULL CHECK (category IN ('precios', 'seguridad', 'servicios', 'basural')),
    author_id VARCHAR(255) NOT NULL,
    author_name VARCHAR(100),
    is_anonymous BOOLEAN DEFAULT false,
    is_verified BOOLEAN DEFAULT false,
    is_visible BOOLEAN DEFAULT true,
    image_url TEXT,
    votes INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices para optimizar queries
CREATE INDEX IF NOT EXISTS idx_posts_author_id ON posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_category ON posts(category);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_is_visible ON posts(is_visible);
CREATE INDEX IF NOT EXISTS idx_posts_is_verified ON posts(is_verified);

-- Tabla de usuarios (opcional, si quieres registrar más datos)
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(255) PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(100),
    is_admin BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Índice para búsqueda por email
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- SEED DATA (Post de bienvenida)
INSERT INTO posts (title, description, phone, category, author_id, author_name, is_verified, is_visible)
VALUES (
    '¡Bienvenidos a Rodríguez Conecta!',
    'Esta es la plataforma oficial para compartir ofertas, alertas de seguridad, servicios y avisos de interés en General Rodríguez. Únete a tu comunidad y conecta con tus vecinos.',
    '+54 9 11 0000-0000',
    'servicios',
    'system',
    '🏘️ Equipo Rodríguez Conecta',
    true,
    true
)
ON CONFLICT DO NOTHING;

-- Verificar que todo se creó correctamente
SELECT 
    'posts' as tabla,
    COUNT(*) as registros,
    MAX(created_at) as ultimo_post
FROM posts
GROUP BY tabla
UNION ALL
SELECT 
    'users',
    COUNT(*),
    MAX(created_at)
FROM users
GROUP BY tabla;

-- ============================================
-- FIN DEL SCRIPT SQL
-- ============================================
