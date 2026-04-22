// api/db.js - Backend seguro para Rodríguez Conecta
// Función serverless para Netlify/Vercel
// Conecta a PostgreSQL (Neon) de forma segura

const { Pool } = require('@neondatabase/serverless');
const { jwtVerify } = require('jose');

// ===== CONFIG =====
const DATABASE_URL = process.env.DATABASE_URL;
const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;
const ADMIN_EMAIL = process.env.VITE_ADMIN_EMAIL;

if (!DATABASE_URL || !CLERK_SECRET_KEY) {
    throw new Error('Faltan variables de entorno: DATABASE_URL y CLERK_SECRET_KEY');
}

const pool = new Pool({ connectionString: DATABASE_URL });

// ===== JWT VERIFICATION (CLERK) =====
async function verifyClerkToken(token) {
    try {
        if (!token || !token.startsWith('Bearer ')) {
            return null;
        }

        const jwt = token.substring(7); // Quitar "Bearer "
        const secret = new TextEncoder().encode(CLERK_SECRET_KEY);
        const { payload } = await jwtVerify(jwt, secret);

        return {
            userId: payload.sub,
            email: payload.email,
            emailVerified: payload.email_verified
        };
    } catch (error) {
        console.error('JWT Verification error:', error);
        return null;
    }
}

// ===== DATABASE OPERATIONS =====

// Obtener todos los posts públicos
async function getPosts() {
    try {
        const result = await pool.query(`
            SELECT id, user_id, user_email, category, message, 
                   image_url, is_anonymous, is_verified, created_at
            FROM posts
            WHERE is_visible = true
            ORDER BY created_at DESC
            LIMIT 100
        `);
        return result.rows;
    } catch (error) {
        console.error('getPosts error:', error);
        throw error;
    }
}

// Obtener todos los posts (solo admin)
async function getAllPosts() {
    try {
        const result = await pool.query(`
            SELECT id, user_id, user_email, category, message, 
                   image_url, is_anonymous, is_verified, is_visible, created_at
            FROM posts
            ORDER BY created_at DESC
            LIMIT 500
        `);
        return result.rows;
    } catch (error) {
        console.error('getAllPosts error:', error);
        throw error;
    }
}

// Crear nuevo post
async function createPost(user, postData) {
    try {
        const { category, message, phone, image_url, is_anonymous } = postData;

        // Validaciones
        if (!category || !message || !phone) {
            throw new Error('Faltan campos requeridos');
        }

        if (message.length > 500) {
            throw new Error('Mensaje muy largo');
        }

        const result = await pool.query(`
            INSERT INTO posts 
            (user_id, user_email, category, message, phone, image_url, is_anonymous, is_verified, is_visible)
            VALUES ($1, $2, $3, $4, $5, $6, $7, false, true)
            RETURNING id, user_id, user_email, category, message, image_url, is_anonymous, is_verified, created_at
        `, [
            user.userId,
            user.email,
            category,
            message,
            phone,
            image_url || null,
            is_anonymous || false
        ]);

        return result.rows[0];
    } catch (error) {
        console.error('createPost error:', error);
        throw error;
    }
}

// Eliminar post (solo propietario)
async function deletePost(user, postId) {
    try {
        const result = await pool.query(`
            DELETE FROM posts
            WHERE id = $1 AND user_id = $2
            RETURNING id
        `, [postId, user.userId]);

        if (result.rows.length === 0) {
            throw new Error('No tienes permiso para eliminar este post');
        }

        return result.rows[0];
    } catch (error) {
        console.error('deletePost error:', error);
        throw error;
    }
}

// Marcar como verificado (solo admin)
async function toggleVerified(postId, verified) {
    try {
        const result = await pool.query(`
            UPDATE posts
            SET is_verified = $1
            WHERE id = $2
            RETURNING id
        `, [verified, postId]);

        if (result.rows.length === 0) {
            throw new Error('Post no encontrado');
        }

        return result.rows[0];
    } catch (error) {
        console.error('toggleVerified error:', error);
        throw error;
    }
}

// Ocultar/Mostrar post (solo admin)
async function toggleVisible(postId, visible) {
    try {
        const result = await pool.query(`
            UPDATE posts
            SET is_visible = $1
            WHERE id = $2
            RETURNING id
        `, [visible, postId]);

        if (result.rows.length === 0) {
            throw new Error('Post no encontrado');
        }

        return result.rows[0];
    } catch (error) {
        console.error('toggleVisible error:', error);
        throw error;
    }
}

// Eliminar post (solo admin)
async function adminDeletePost(postId) {
    try {
        const result = await pool.query(`
            DELETE FROM posts
            WHERE id = $1
            RETURNING id
        `, [postId]);

        if (result.rows.length === 0) {
            throw new Error('Post no encontrado');
        }

        return result.rows[0];
    } catch (error) {
        console.error('adminDeletePost error:', error);
        throw error;
    }
}

// ===== HANDLER PRINCIPAL =====
async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        const { action, ...data } = req.body;

        // Acciones públicas (sin autenticación)
        if (action === 'GET_POSTS') {
            const posts = await getPosts();
            return res.status(200).json({ posts });
        }

        // Todas las demás acciones requieren autenticación
        const token = req.headers.authorization;
        const user = await verifyClerkToken(token);

        if (!user) {
            return res.status(401).json({ error: 'No autenticado' });
        }

        // Acciones autenticadas
        if (action === 'CREATE_POST') {
            const post = await createPost(user, data);
            return res.status(201).json({ post });
        }

        if (action === 'DELETE_POST') {
            const post = await deletePost(user, data.post_id);
            return res.status(200).json({ post });
        }

        // Acciones solo admin
        if (user.email !== ADMIN_EMAIL) {
            return res.status(403).json({ error: 'No tienes permisos de admin' });
        }

        if (action === 'GET_ALL_POSTS') {
            const posts = await getAllPosts();
            return res.status(200).json({ posts });
        }

        if (action === 'TOGGLE_VERIFIED') {
            const post = await toggleVerified(data.post_id, data.verified);
            return res.status(200).json({ post });
        }

        if (action === 'TOGGLE_VISIBLE') {
            const post = await toggleVisible(data.post_id, data.visible);
            return res.status(200).json({ post });
        }

        if (action === 'ADMIN_DELETE_POST') {
            const post = await adminDeletePost(data.post_id);
            return res.status(200).json({ post });
        }

        return res.status(400).json({ error: 'Acción no válida' });

    } catch (error) {
        console.error('Handler error:', error);
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
}

// Exportar para Netlify Functions
exports.handler = async (event, context) => {
    const req = {
        method: event.httpMethod,
        headers: event.headers,
        body: event.body ? JSON.parse(event.body) : {}
    };

    let body = '';
    let statusCode = 200;
    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    };

    const res = {
        setHeader: (key, value) => { headers[key] = value; },
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
        headers,
        body
    };
};

// Exportar para Vercel Functions
module.exports = handler;
