/**
 * Función Serverless: API segura para Rodríguez Conecta
 * 
 * Soporta:
 * - Netlify Functions: Copiar a /netlify/functions/db.js
 * - Vercel Functions: Copiar a /api/db.js
 * 
 * Variables de entorno requeridas:
 * - DATABASE_URL: Cadena de conexión a Neon PostgreSQL
 * - CLERK_SECRET_KEY: Secret key de Clerk para validar tokens
 * - ADMIN_EMAIL: Email del administrador
 * 
 * IMPORTANTE: El teléfono NUNCA se devuelve en el JSON a usuarios no propietarios.
 * Las políticas de acceso se validan en el servidor (Backend).
 */

const { sql } = require('@neondatabase/serverless');
const { createClient } = require('@supabase/supabase-js'); // Alternativa si usas Supabase
// O para Neon + pg estándar:
const postgres = require('postgres');

// ========== VARIABLES DE ENTORNO ==========
const DATABASE_URL = process.env.DATABASE_URL;
const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;
const ADMIN_EMAIL = process.env.VITE_ADMIN_EMAIL || 'admin@ejemplo.com';

if (!DATABASE_URL || !CLERK_SECRET_KEY) {
    throw new Error('Faltan variables de entorno: DATABASE_URL, CLERK_SECRET_KEY');
}

// ========== CONEXIÓN A BDD ==========
// Opción 1: Neon con @neondatabase/serverless
const db = sql(DATABASE_URL);

// Opción 2: PostgreSQL estándar (si usas Neon con pg)
// const db = postgres(DATABASE_URL, { ssl: 'require' });

// ========== VALIDACIÓN DE JWT CLERK ==========
async function verificarTokenClerk(authHeader) {
    /**
     * Verifica y decodifica el JWT de Clerk.
     * Retorna { user_id, email } o null si es inválido.
     */
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }

    const token = authHeader.slice(7);

    try {
        // Validar JWT con Clerk (simplificado - en producción usar biblioteca jwt)
        const response = await fetch('https://api.clerk.com/v1/jwt_templates/validate', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${CLERK_SECRET_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ token })
        });

        if (!response.ok) {
            console.error('Token inválido:', response.status);
            return null;
        }

        const data = await response.json();
        return {
            user_id: data.sub,
            email: data.email
        };
    } catch (error) {
        console.error('Error validando token:', error);
        return null;
    }
}

// ========== HELPERS ==========
function enviarJSON(statusCode, data) {
    return {
        statusCode,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    };
}

function enviarError(statusCode, mensaje) {
    return enviarJSON(statusCode, { error: mensaje });
}

// ========== RUTAS ==========

/**
 * GET /api/posts
 * Obtiene todos los posts visibles (o todos si es admin viendo ocultos)
 */
async function getPosts(event, user) {
    try {
        let query = `
            SELECT 
                id,
                title,
                description,
                phone,
                category,
                author_id,
                author_name,
                is_anonymous,
                is_verified,
                is_visible,
                image_url,
                votes,
                created_at
            FROM posts
            WHERE is_visible = true
            ORDER BY created_at DESC
            LIMIT 100
        `;

        // Si es admin, mostrar también los ocultos si lo solicita
        if (user && user.email === ADMIN_EMAIL && event.queryStringParameters?.includeHidden === 'true') {
            query = `
                SELECT 
                    id, title, description, phone, category, author_id, author_name,
                    is_anonymous, is_verified, is_visible, image_url, votes, created_at
                FROM posts
                ORDER BY created_at DESC
                LIMIT 100
            `;
        }

        const posts = await db.unsafe(query);

        // CLAVE: Nunca devolver teléfono a usuarios no propietarios
        // Solo el frontend renderiza sin mostrar el teléfono en el DOM
        const postsSeguro = posts.map(post => ({
            ...post,
            phone: user?.id === post.author_id ? post.phone : undefined // Solo el dueño ve su teléfono en el JSON
        }));

        return enviarJSON(200, postsSeguro);
    } catch (error) {
        console.error('Error obteniendo posts:', error);
        return enviarError(500, 'Error obteniendo posts');
    }
}

/**
 * POST /api/posts
 * Crear nuevo post (requiere autenticación)
 */
async function crearPost(event, user) {
    if (!user) {
        return enviarError(401, 'No autenticado');
    }

    try {
        const body = JSON.parse(event.body || '{}');
        const { title, description, phone, category, is_anonymous, image_url } = body;

        // Validaciones
        if (!title?.trim() || !description?.trim() || !phone?.trim() || !category) {
            return enviarError(400, 'Faltan campos requeridos');
        }

        const autorNombre = is_anonymous ? 'Anónimo' : (user.name || 'Usuario');

        const query = `
            INSERT INTO posts (title, description, phone, category, author_id, author_name, is_anonymous, image_url, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
            RETURNING id, title, description, phone, category, author_id, author_name, is_anonymous, is_verified, is_visible, image_url, votes, created_at
        `;

        const [newPost] = await db.unsafe(query, [
            title,
            description,
            phone,
            category,
            user.id,
            autorNombre,
            is_anonymous,
            image_url || null
        ]);

        return enviarJSON(201, newPost);
    } catch (error) {
        console.error('Error creando post:', error);
        return enviarError(500, 'Error creando post');
    }
}

/**
 * DELETE /api/posts/:id
 * Eliminar un post (solo el dueño)
 */
async function eliminarPost(event, user, postId) {
    if (!user) {
        return enviarError(401, 'No autenticado');
    }

    try {
        // Verificar que el post pertenece al usuario
        const [post] = await db.unsafe('SELECT author_id FROM posts WHERE id = $1', [postId]);

        if (!post) {
            return enviarError(404, 'Post no encontrado');
        }

        if (post.author_id !== user.id) {
            return enviarError(403, 'No tienes permiso para eliminar este post');
        }

        await db.unsafe('DELETE FROM posts WHERE id = $1', [postId]);
        return enviarJSON(200, { message: 'Post eliminado' });
    } catch (error) {
        console.error('Error eliminando post:', error);
        return enviarError(500, 'Error eliminando post');
    }
}

/**
 * PATCH /api/posts/:id/verify
 * Marcar como verificado (solo admin)
 */
async function marcarVerificado(event, user, postId) {
    if (!user || user.email !== ADMIN_EMAIL) {
        return enviarError(403, 'Solo admin puede verificar');
    }

    try {
        const body = JSON.parse(event.body || '{}');
        const { is_verified } = body;

        await db.unsafe('UPDATE posts SET is_verified = $1 WHERE id = $2', [is_verified, postId]);
        return enviarJSON(200, { message: 'Post actualizado' });
    } catch (error) {
        console.error('Error:', error);
        return enviarError(500, 'Error actualizando post');
    }
}

/**
 * PATCH /api/posts/:id/hide
 * Ocultar/mostrar post (solo admin)
 */
async function ocultarPost(event, user, postId) {
    if (!user || user.email !== ADMIN_EMAIL) {
        return enviarError(403, 'Solo admin puede ocultar posts');
    }

    try {
        const body = JSON.parse(event.body || '{}');
        const { is_visible } = body;

        await db.unsafe('UPDATE posts SET is_visible = $1 WHERE id = $2', [is_visible, postId]);
        return enviarJSON(200, { message: 'Post actualizado' });
    } catch (error) {
        console.error('Error:', error);
        return enviarError(500, 'Error actualizando post');
    }
}

/**
 * DELETE /api/posts/:id/admin
 * Eliminar post como admin
 */
async function eliminarPostAdmin(event, user, postId) {
    if (!user || user.email !== ADMIN_EMAIL) {
        return enviarError(403, 'Solo admin puede eliminar posts');
    }

    try {
        await db.unsafe('DELETE FROM posts WHERE id = $1', [postId]);
        return enviarJSON(200, { message: 'Post eliminado por admin' });
    } catch (error) {
        console.error('Error:', error);
        return enviarError(500, 'Error eliminando post');
    }
}

// ========== HANDLER PRINCIPAL ==========
exports.handler = async (event) => {
    /**
     * Función principal que rutea las peticiones HTTP.
     * 
     * En Netlify: Se invoca automáticamente.
     * En Vercel: Se ejecuta como API Route.
     */

    const method = event.httpMethod || event.method || 'GET';
    const path = event.path || event.url;
    const authHeader = event.headers?.authorization || event.headers?.Authorization;

    console.log(`${method} ${path}`);

    // Verificar autenticación
    const user = await verificarTokenClerk(authHeader);

    // CORS headers
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    };

    // Preflight para CORS
    if (method === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: corsHeaders,
            body: ''
        };
    }

    // Parsear ruta
    const pathParts = path.split('/').filter(p => p);
    
    try {
        // GET /api/posts
        if (method === 'GET' && pathParts[2] === 'posts') {
            return getPosts(event, user);
        }

        // POST /api/posts
        if (method === 'POST' && pathParts[2] === 'posts') {
            return crearPost(event, user);
        }

        // DELETE /api/posts/:id
        if (method === 'DELETE' && pathParts[2] === 'posts' && pathParts[3] && !pathParts[4]) {
            return eliminarPost(event, user, parseInt(pathParts[3]));
        }

        // PATCH /api/posts/:id/verify
        if (method === 'PATCH' && pathParts[2] === 'posts' && pathParts[3] && pathParts[4] === 'verify') {
            return marcarVerificado(event, user, parseInt(pathParts[3]));
        }

        // PATCH /api/posts/:id/hide
        if (method === 'PATCH' && pathParts[2] === 'posts' && pathParts[3] && pathParts[4] === 'hide') {
            return ocultarPost(event, user, parseInt(pathParts[3]));
        }

        // DELETE /api/posts/:id/admin
        if (method === 'DELETE' && pathParts[2] === 'posts' && pathParts[3] && pathParts[4] === 'admin') {
            return eliminarPostAdmin(event, user, parseInt(pathParts[3]));
        }

        // Ruta no encontrada
        return enviarError(404, 'Ruta no encontrada');
    } catch (error) {
        console.error('Error:', error);
        return enviarError(500, 'Error interno del servidor');
    }
};
