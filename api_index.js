// api/index.js - Backend Serverless para Rodríguez Conecta
// Compatible con Netlify Functions y Vercel Serverless
// Node.js 18+

const { Client } = require('@neondatabase/serverless');

// ========================================
// CONFIGURATION
// ========================================
const DATABASE_URL = process.env.DATABASE_URL;
const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;
const ADMIN_EMAIL = process.env.VITE_ADMIN_EMAIL || 'admin@example.com';

if (!DATABASE_URL) {
    throw new Error('DATABASE_URL no está definida en variables de entorno');
}

if (!CLERK_SECRET_KEY) {
    throw new Error('CLERK_SECRET_KEY no está definida en variables de entorno');
}

// ========================================
// JWT VERIFICATION (CLERK)
// ========================================
const crypto = require('crypto');

async function verifyClerkToken(token) {
    if (!token || !token.startsWith('Bearer ')) {
        return null;
    }

    const jwt = token.substring(7);
    const parts = jwt.split('.');

    if (parts.length !== 3) {
        return null;
    }

    try {
        // Decodificar el payload (sin verificar firma para MVP)
        // En producción, verificar la firma con CLERK_SECRET_KEY
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
        return {
            userId: payload.sub,
            email: payload.email,
            emailVerified: payload.email_verified
        };
    } catch (error) {
        console.error('Error verifying token:', error);
        return null;
    }
}

// ========================================
// DATABASE OPERATIONS
// ========================================
async function getConnection() {
    const client = new Client({ connectionString: DATABASE_URL });
    await client.connect();
    return client;
}

// 1. Obtener posts visibles (público)
async function getPosts() {
    const client = await getConnection();
    try {
        const result = await client.query(`
            SELECT id, user_id, user_name, user_email, category, message, phone, image_url, created_at, is_verified
            FROM posts
            WHERE is_visible = true
            ORDER BY created_at DESC
            LIMIT 50
        `);
        return { success: true, posts: result.rows };
    } catch (error) {
        console.error('Error getting posts:', error);
        return { success: false, error: 'Error al obtener avisos' };
    } finally {
        await client.end();
    }
}

// 2. Obtener todos los posts (admin only)
async function getAllPosts() {
    const client = await getConnection();
    try {
        const result = await client.query(`
            SELECT id, user_id, user_name, user_email, category, message, phone, image_url, created_at, is_visible, is_verified
            FROM posts
            ORDER BY created_at DESC
            LIMIT 200
        `);
        return { success: true, posts: result.rows };
    } catch (error) {
        console.error('Error getting all posts:', error);
        return { success: false, error: 'Error al obtener avisos' };
    } finally {
        await client.end();
    }
}

// 3. Crear post
async function createPost(user, data) {
    const client = await getConnection();
    try {
        const { category, message, phone, image_url } = data;

        if (!category || !message || !phone) {
            return { success: false, error: 'Faltan campos requeridos' };
        }

        if (message.length > 500) {
            return { success: false, error: 'El mensaje es muy largo (máx 500)' };
        }

        const result = await client.query(`
            INSERT INTO posts (user_id, user_name, user_email, category, message, phone, image_url, is_visible, is_verified)
            VALUES ($1, $2, $3, $4, $5, $6, $7, true, false)
            RETURNING id, user_id, user_name, category, message, phone, image_url, created_at
        `, [
            user.userId,
            user.email.split('@')[0],  // user_name
            user.email,
            category,
            message,
            phone,
            image_url || null
        ]);

        return { success: true, post: result.rows[0] };
    } catch (error) {
        console.error('Error creating post:', error);
        return { success: false, error: 'Error al crear aviso' };
    } finally {
        await client.end();
    }
}

// 4. Eliminar post (solo propietario)
async function deletePost(user, postId) {
    const client = await getConnection();
    try {
        const result = await client.query(`
            DELETE FROM posts
            WHERE id = $1 AND user_id = $2
            RETURNING id
        `, [postId, user.userId]);

        if (result.rows.length === 0) {
            return { success: false, error: 'No tienes permiso para eliminar este aviso' };
        }

        return { success: true };
    } catch (error) {
        console.error('Error deleting post:', error);
        return { success: false, error: 'Error al eliminar aviso' };
    } finally {
        await client.end();
    }
}

// 5. Toggle visibilidad (admin only)
async function toggleVisibility(postId, visible) {
    const client = await getConnection();
    try {
        const result = await client.query(`
            UPDATE posts
            SET is_visible = $1
            WHERE id = $2
            RETURNING id
        `, [visible, postId]);

        if (result.rows.length === 0) {
            return { success: false, error: 'Aviso no encontrado' };
        }

        return { success: true };
    } catch (error) {
        console.error('Error toggling visibility:', error);
        return { success: false, error: 'Error al actualizar aviso' };
    } finally {
        await client.end();
    }
}

// 6. Obtener estadísticas
async function getStats() {
    const client = await getConnection();
    try {
        const weekResult = await client.query(`
            SELECT COUNT(*) as count
            FROM posts
            WHERE created_at >= NOW() - INTERVAL '7 days'
            AND is_visible = true
        `);

        const totalResult = await client.query(`
            SELECT COUNT(*) as count
            FROM posts
            WHERE is_visible = true
        `);

        return {
            success: true,
            weekly_count: parseInt(weekResult.rows[0].count),
            total_count: parseInt(totalResult.rows[0].count)
        };
    } catch (error) {
        console.error('Error getting stats:', error);
        return { success: false, weekly_count: 0, total_count: 0 };
    } finally {
        await client.end();
    }
}

// ========================================
// MAIN HANDLER
// ========================================
async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Content-Type', 'application/json');

    // Preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        // ===== GET REQUESTS =====
        if (req.method === 'GET') {
            const { get, id } = req.query;

            if (get === 'posts') {
                const result = await getPosts();
                return res.status(200).json(result);
            }

            if (get === 'stats') {
                const result = await getStats();
                return res.status(200).json(result);
            }

            if (get === 'all_posts') {
                // Admin only
                const authHeader = req.headers.authorization || '';
                const user = await verifyClerkToken(authHeader);

                if (!user) {
                    return res.status(401).json({ success: false, error: 'No autenticado' });
                }

                if (user.email !== ADMIN_EMAIL) {
                    return res.status(403).json({ success: false, error: 'No autorizado' });
                }

                const result = await getAllPosts();
                return res.status(200).json(result);
            }

            return res.status(400).json({ success: false, error: 'Bad request' });
        }

        // ===== POST REQUESTS =====
        if (req.method === 'POST') {
            const authHeader = req.headers.authorization || '';
            const user = await verifyClerkToken(authHeader);

            if (!user) {
                return res.status(401).json({ success: false, error: 'No autenticado' });
            }

            const result = await createPost(user, req.body);
            return res.status(result.success ? 201 : 400).json(result);
        }

        // ===== DELETE REQUESTS =====
        if (req.method === 'DELETE') {
            const authHeader = req.headers.authorization || '';
            const user = await verifyClerkToken(authHeader);

            if (!user) {
                return res.status(401).json({ success: false, error: 'No autenticado' });
            }

            const { id } = req.query;
            if (!id) {
                return res.status(400).json({ success: false, error: 'ID requerido' });
            }

            const result = await deletePost(user, id);
            return res.status(result.success ? 200 : 403).json(result);
        }

        // ===== PATCH REQUESTS =====
        if (req.method === 'PATCH') {
            const authHeader = req.headers.authorization || '';
            const user = await verifyClerkToken(authHeader);

            if (!user) {
                return res.status(401).json({ success: false, error: 'No autenticado' });
            }

            if (user.email !== ADMIN_EMAIL) {
                return res.status(403).json({ success: false, error: 'No autorizado' });
            }

            const { post_id, action, value } = req.body;

            if (action === 'toggle_visible') {
                const result = await toggleVisibility(post_id, value);
                return res.status(200).json(result);
            }

            return res.status(400).json({ success: false, error: 'Acción no válida' });
        }

        return res.status(405).json({ success: false, error: 'Method not allowed' });
    } catch (error) {
        console.error('Handler error:', error);
        return res.status(500).json({ success: false, error: 'Error interno del servidor' });
    }
}

// ========================================
// EXPORTS (Netlify/Vercel)
// ========================================

// Para Netlify Functions
exports.handler = async (event, context) => {
    const req = {
        method: event.httpMethod,
        headers: event.headers,
        query: event.queryStringParameters || {},
        body: event.body ? JSON.parse(event.body) : {}
    };

    let statusCode = 200;
    let body = '{}';
    const responseHeaders = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
    };

    const res = {
        setHeader: (key, value) => {
            responseHeaders[key] = value;
        },
        status: (code) => ({
            json: (data) => {
                statusCode = code;
                body = JSON.stringify(data);
            },
            end: () => {}
        }),
        json: (data) => {
            body = JSON.stringify(data);
        },
        end: () => {}
    };

    await handler(req, res);

    return {
        statusCode,
        headers: responseHeaders,
        body
    };
};

// Para Vercel Functions
module.exports = (req, res) => {
    handler(req, res);
};
