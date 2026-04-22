/**
 * 🔐 API SERVERLESS - Rodríguez Conecta
 * 
 * Desplegá esto en:
 * - Netlify: netlify/functions/db.js (o api/)
 * - Vercel: api/db.js
 * 
 * Variables de entorno necesarias:
 * - DATABASE_URL: postgresql://...@neon.tech/...
 * - CLERK_SECRET_KEY: sk_test_...
 * - ADMIN_EMAIL: admin@ejemplo.com
 */

const { Client } = require('@neondatabase/serverless');
const crypto = require('crypto');

const ADMIN_EMAIL = process.env.VITE_ADMIN_EMAIL || 'admin@ejemplo.com';

// ===== DB UTILS =====
async function getDB() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
    });
    await client.connect();
    return client;
}

// Hashear teléfono para no exponer en BD visible
function hashPhone(phone) {
    return crypto.createHash('sha256').update(phone + 'salt123').digest('hex');
}

// ===== CLERK AUTH VERIFICATION =====
async function verifyToken(token) {
    try {
        if (!token) return null;

        // Remover "Bearer " si está presente
        const authToken = token.replace('Bearer ', '');

        // Llamar a API de Clerk para verificar el token
        const response = await fetch('https://api.clerk.com/v1/verify', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.CLERK_SECRET_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ token: authToken })
        });

        if (!response.ok) return null;

        const data = await response.json();
        return data.user || null;
    } catch (e) {
        console.error('Error verifying token:', e);
        return null;
    }
}

// ===== HANDLERS =====

// 1. GET POSTS (público)
async function handleGetPosts(category) {
    const client = await getDB();
    try {
        let query = `
            SELECT 
                id, 
                categoria, 
                mensaje, 
                image_url, 
                phone_hash, 
                author_id, 
                author_email, 
                is_verified, 
                is_hidden,
                created_at
            FROM posts
            WHERE is_hidden = FALSE AND is_visible = TRUE
        `;

        const params = [];

        if (category !== 'todos') {
            query += ` AND categoria = $1`;
            params.push(category);
        }

        query += ` ORDER BY created_at DESC LIMIT 100`;

        const result = await client.query(query, params);

        // Mapear phone_hash a data attribute (nunca revelar el teléfono)
        const posts = result.rows.map(row => ({
            ...row,
            phone_hash: row.phone_hash // Este se pasa al frontend como data-phone
        }));

        return {
            success: true,
            posts
        };
    } finally {
        await client.end();
    }
}

// 2. CREATE POST (autenticado)
async function handleCreatePost(body, user) {
    if (!user) {
        return { success: false, error: 'No autenticado' };
    }

    const { categoria, mensaje, phone, image_url, author_id, author_email } = body;

    if (!categoria || !mensaje || !phone || author_id !== user.id) {
        return { success: false, error: 'Datos inválidos' };
    }

    const client = await getDB();
    try {
        const phoneHash = hashPhone(phone);

        const result = await client.query(
            `INSERT INTO posts (categoria, mensaje, phone_hash, image_url, author_id, author_email, is_visible, is_hidden, is_verified)
             VALUES ($1, $2, $3, $4, $5, $6, true, false, false)
             RETURNING id`,
            [categoria, mensaje, phoneHash, image_url || null, author_id, author_email]
        );

        return {
            success: true,
            post_id: result.rows[0].id
        };
    } finally {
        await client.end();
    }
}

// 3. DELETE POST (solo dueño)
async function handleDeletePost(body, user) {
    if (!user) {
        return { success: false, error: 'No autenticado' };
    }

    const { id, author_id } = body;

    // Validar que el usuario es el dueño
    if (author_id !== user.id) {
        return { success: false, error: 'No permitido: no eres el dueño' };
    }

    const client = await getDB();
    try {
        // Verificar que el post existe y pertenece al usuario
        const checkResult = await client.query(
            'SELECT author_id FROM posts WHERE id = $1',
            [id]
        );

        if (checkResult.rows.length === 0) {
            return { success: false, error: 'Post no encontrado' };
        }

        if (checkResult.rows[0].author_id !== author_id) {
            return { success: false, error: 'No tienes permiso' };
        }

        // Eliminar
        await client.query('DELETE FROM posts WHERE id = $1', [id]);

        return { success: true };
    } finally {
        await client.end();
    }
}

// 4. GET ALL POSTS (solo admin)
async function handleGetAllPosts(user) {
    if (!user || user.email !== ADMIN_EMAIL) {
        return { success: false, error: 'Acceso denegado' };
    }

    const client = await getDB();
    try {
        const result = await client.query(
            `SELECT 
                id, categoria, mensaje, image_url, author_id, author_email, 
                is_verified, is_hidden, is_visible, created_at
             FROM posts
             ORDER BY created_at DESC`
        );

        return {
            success: true,
            posts: result.rows
        };
    } finally {
        await client.end();
    }
}

// 5. UPDATE POST (solo admin)
async function handleUpdatePost(body, user) {
    if (!user || user.email !== ADMIN_EMAIL) {
        return { success: false, error: 'Acceso denegado' };
    }

    const { id, updates } = body;

    if (!id || !updates) {
        return { success: false, error: 'Datos inválidos' };
    }

    const client = await getDB();
    try {
        const keys = Object.keys(updates);
        const values = Object.values(updates);
        values.push(id);

        const setClause = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
        const query = `UPDATE posts SET ${setClause} WHERE id = $${keys.length + 1}`;

        await client.query(query, values);

        return { success: true };
    } finally {
        await client.end();
    }
}

// 6. ADMIN DELETE (solo admin)
async function handleAdminDelete(body, user) {
    if (!user || user.email !== ADMIN_EMAIL) {
        return { success: false, error: 'Acceso denegado' };
    }

    const { id } = body;

    const client = await getDB();
    try {
        await client.query('DELETE FROM posts WHERE id = $1', [id]);
        return { success: true };
    } finally {
        await client.end();
    }
}

// ===== MAIN HANDLER =====
async function handler(event, context) {
    // CORS headers
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Content-Type': 'application/json'
    };

    // CORS preflight
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }

    try {
        // Obtener token del header
        const token = event.headers.authorization;

        // GET requests (públicas)
        if (event.httpMethod === 'GET') {
            const action = event.queryStringParameters?.action;
            const category = event.queryStringParameters?.category || 'todos';

            if (action === 'getPosts') {
                const result = await handleGetPosts(category);
                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify(result)
                };
            }

            if (action === 'getAllPosts') {
                const user = await verifyToken(token);
                const result = await handleGetAllPosts(user);
                return {
                    statusCode: user ? 200 : 403,
                    headers,
                    body: JSON.stringify(result)
                };
            }
        }

        // POST requests (requieren auth)
        if (event.httpMethod === 'POST') {
            const user = await verifyToken(token);
            if (!user) {
                return {
                    statusCode: 403,
                    headers,
                    body: JSON.stringify({ success: false, error: 'No autenticado' })
                };
            }

            const body = JSON.parse(event.body || '{}');
            const action = body.action;

            let result;

            switch (action) {
                case 'createPost':
                    result = await handleCreatePost(body, user);
                    break;
                case 'deletePost':
                    result = await handleDeletePost(body, user);
                    break;
                case 'updatePost':
                    result = await handleUpdatePost(body, user);
                    break;
                case 'adminDeletePost':
                    result = await handleAdminDelete(body, user);
                    break;
                default:
                    result = { success: false, error: 'Acción desconocida' };
            }

            return {
                statusCode: result.success ? 200 : 400,
                headers,
                body: JSON.stringify(result)
            };
        }

        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    } catch (e) {
        console.error('Error:', e);
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ success: false, error: e.message })
        };
    }
}

// ===== EXPORTS =====
module.exports = { handler };

// Para Netlify
exports.handler = handler;

// Para Vercel
module.exports = async (req, res) => {
    const event = {
        httpMethod: req.method,
        queryStringParameters: req.query,
        headers: req.headers,
        body: req.method === 'POST' ? JSON.stringify(req.body) : undefined
    };

    const response = await handler(event, {});
    res.status(response.statusCode).json(JSON.parse(response.body));
};
