/**
 * Rodríguez Conecta - Función Serverless (Netlify/Vercel)
 * Proxyea consultas seguras a PostgreSQL (Neon)
 * 
 * Variables de entorno necesarias:
 * - DATABASE_URL (Connection string de Neon)
 * - CLERK_SECRET_KEY (Para validar JWT de Clerk)
 * - VITE_ADMIN_EMAIL (Email del admin)
 */

import { Pool } from '@neondatabase/serverless';
import { jwtVerify } from 'jose';

// ==========================================
// UTILS & CONFIG
// ==========================================

const ADMIN_EMAIL = process.env.VITE_ADMIN_EMAIL || 'admin@example.com';
const CLERK_SECRET_KEY = new TextEncoder().encode(process.env.CLERK_SECRET_KEY || '');

// Pool de conexiones a Neon
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

// Función helper para respuestas
const response = (statusCode, body) => ({
    statusCode,
    headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
    body: JSON.stringify(body),
});

// ==========================================
// AUTH VERIFICATION (CLERK JWT)
// ==========================================

async function verifyClerkToken(token) {
    try {
        if (!token || !CLERK_SECRET_KEY.byteLength) {
            return null;
        }

        const bearerToken = token.replace('Bearer ', '');
        const verified = await jwtVerify(bearerToken, CLERK_SECRET_KEY);
        return verified.payload;
    } catch (error) {
        console.error('Token verification error:', error);
        return null;
    }
}

// ==========================================
// DATABASE SCHEMA (SQL para ejecutar en Neon)
// ==========================================

const SCHEMA_SQL = `
-- Crear tabla posts con RLS (Row Level Security)
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

-- Habilitar Row Level Security
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Policy: Los usuarios pueden ver solo posts visibles, excepto admins
CREATE POLICY IF NOT EXISTS posts_visible_policy ON posts
    FOR SELECT USING (is_visible = TRUE OR user_id = current_user_id());

-- Policy: Los usuarios solo pueden crear posts
CREATE POLICY IF NOT EXISTS posts_create_policy ON posts
    FOR INSERT WITH CHECK (user_id = current_user_id());

-- Policy: Los usuarios solo pueden actualizar sus propios posts
CREATE POLICY IF NOT EXISTS posts_update_policy ON posts
    FOR UPDATE USING (user_id = current_user_id());

-- Policy: Los usuarios solo pueden eliminar sus propios posts
CREATE POLICY IF NOT EXISTS posts_delete_policy ON posts
    FOR DELETE USING (user_id = current_user_id());
`;

// ==========================================
// CRUD FUNCTIONS
// ==========================================

async function createPost(user_id, user_email, category, message, phone, image_url, is_anonymous) {
    try {
        const query = `
            INSERT INTO posts (user_id, user_email, category, message, phone, image_url, is_anonymous)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *;
        `;

        const result = await pool.query(query, [
            user_id,
            user_email,
            category,
            message,
            phone || null,
            image_url || null,
            is_anonymous,
        ]);

        return result.rows[0];
    } catch (error) {
        console.error('Error creating post:', error);
        throw new Error('Error al crear el aviso');
    }
}

async function getPosts(visibleOnly = true) {
    try {
        const query = visibleOnly
            ? 'SELECT * FROM posts WHERE is_visible = TRUE ORDER BY created_at DESC;'
            : 'SELECT * FROM posts ORDER BY created_at DESC;';

        const result = await pool.query(query);
        return result.rows;
    } catch (error) {
        console.error('Error getting posts:', error);
        throw new Error('Error al obtener avisos');
    }
}

async function deletePost(postId, userId, isAdmin = false) {
    try {
        let query;
        let params;

        if (isAdmin) {
            // Admin puede eliminar cualquier post
            query = 'DELETE FROM posts WHERE id = $1 RETURNING *;';
            params = [postId];
        } else {
            // Usuario solo puede eliminar sus propios posts
            query = 'DELETE FROM posts WHERE id = $1 AND user_id = $2 RETURNING *;';
            params = [postId, userId];
        }

        const result = await pool.query(query, params);

        if (result.rows.length === 0) {
            throw new Error('Post no encontrado o sin permiso para eliminarlo');
        }

        return result.rows[0];
    } catch (error) {
        console.error('Error deleting post:', error);
        throw error;
    }
}

async function toggleVerified(postId, isAdmin = false) {
    if (!isAdmin) {
        throw new Error('Solo admins pueden verificar posts');
    }

    try {
        const query = `
            UPDATE posts 
            SET is_verified = NOT is_verified, updated_at = NOW()
            WHERE id = $1 
            RETURNING *;
        `;

        const result = await pool.query(query, [postId]);

        if (result.rows.length === 0) {
            throw new Error('Post no encontrado');
        }

        return result.rows[0];
    } catch (error) {
        console.error('Error toggling verified:', error);
        throw error;
    }
}

async function toggleVisible(postId, isAdmin = false) {
    if (!isAdmin) {
        throw new Error('Solo admins pueden ocultar posts');
    }

    try {
        const query = `
            UPDATE posts 
            SET is_visible = NOT is_visible, updated_at = NOW()
            WHERE id = $1 
            RETURNING *;
        `;

        const result = await pool.query(query, [postId]);

        if (result.rows.length === 0) {
            throw new Error('Post no encontrado');
        }

        return result.rows[0];
    } catch (error) {
        console.error('Error toggling visible:', error);
        throw error;
    }
}

// ==========================================
// MAIN HANDLER
// ==========================================

export async function handler(event, context) {
    // Manejo de CORS preflight
    if (event.httpMethod === 'OPTIONS') {
        return response(200, { message: 'OK' });
    }

    try {
        const action = event.queryStringParameters?.action || 
                      (event.body ? JSON.parse(event.body).action : null);

        // ===== PÚBLICAS (GET) =====
        if (event.httpMethod === 'GET') {
            if (action === 'GET_POSTS') {
                const posts = await getPosts(true);
                return response(200, { posts });
            }
        }

        // ===== PROTEGIDAS (requieren autenticación) =====
        const authHeader = event.headers.authorization || '';
        const user = await verifyClerkToken(authHeader);

        if (!user) {
            return response(401, { error: 'No autenticado' });
        }

        const userId = user.sub;
        const userEmail = user.email;
        const isAdmin = userEmail === ADMIN_EMAIL;

        const body = JSON.parse(event.body || '{}');

        // ===== CREATE POST =====
        if (event.httpMethod === 'POST' && action === 'CREATE_POST') {
            const { category, message, phone, image_url, is_anonymous } = body;

            if (!category || !message) {
                return response(400, { error: 'Categoría y mensaje requeridos' });
            }

            const post = await createPost(
                userId,
                userEmail,
                category,
                message,
                phone,
                image_url,
                is_anonymous
            );

            return response(201, { post, message: 'Aviso creado' });
        }

        // ===== DELETE POST =====
        if (event.httpMethod === 'POST' && action === 'DELETE_POST') {
            const { post_id } = body;

            if (!post_id) {
                return response(400, { error: 'ID de post requerido' });
            }

            const post = await deletePost(post_id, userId, false);
            return response(200, { post, message: 'Aviso eliminado' });
        }

        // ===== ADMIN: GET ALL POSTS =====
        if (event.httpMethod === 'GET' && action === 'GET_ALL_POSTS' && isAdmin) {
            const posts = await getPosts(false);
            return response(200, { posts });
        }

        // ===== ADMIN: TOGGLE VERIFIED =====
        if (event.httpMethod === 'POST' && action === 'TOGGLE_VERIFIED' && isAdmin) {
            const { post_id } = body;

            if (!post_id) {
                return response(400, { error: 'ID de post requerido' });
            }

            const post = await toggleVerified(post_id, true);
            return response(200, { post, message: 'Estado de verificación actualizado' });
        }

        // ===== ADMIN: TOGGLE VISIBLE =====
        if (event.httpMethod === 'POST' && action === 'TOGGLE_VISIBLE' && isAdmin) {
            const { post_id } = body;

            if (!post_id) {
                return response(400, { error: 'ID de post requerido' });
            }

            const post = await toggleVisible(post_id, true);
            return response(200, { post, message: 'Visibilidad actualizada' });
        }

        // ===== ADMIN: DELETE POST (ADMIN) =====
        if (event.httpMethod === 'POST' && action === 'ADMIN_DELETE_POST' && isAdmin) {
            const { post_id } = body;

            if (!post_id) {
                return response(400, { error: 'ID de post requerido' });
            }

            const post = await deletePost(post_id, userId, true);
            return response(200, { post, message: 'Aviso eliminado (Admin)' });
        }

        return response(400, { error: 'Acción no válida' });
    } catch (error) {
        console.error('Handler error:', error);
        return response(500, { error: error.message || 'Error del servidor' });
    }
}

// ==========================================
// EXPORT SCHEMA para setup manual
// ==========================================

export { SCHEMA_SQL };
