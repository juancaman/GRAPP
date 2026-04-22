// api/db.js - Backend Serverless para Rodríguez Conecta
// Proxy seguro entre frontend (index.html) y base de datos Neon
// Netlify Functions o Vercel Functions

const { Pool } = require('@neondatabase/serverless');
const { jwtVerify } = require('jose');

// ===== CONFIGURACIÓN =====
const DATABASE_URL = process.env.DATABASE_URL;
const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;
const ADMIN_EMAIL = process.env.VITE_ADMIN_EMAIL;

if (!DATABASE_URL) {
    throw new Error('DATABASE_URL no está definida en variables de entorno');
}

if (!CLERK_SECRET_KEY) {
    throw new Error('CLERK_SECRET_KEY no está definida en variables de entorno');
}

// Pool de conexiones a Neon
const pool = new Pool({ connectionString: DATABASE_URL });

// ===== JWT VERIFICATION (CLERK) =====
async function verificarClerkToken(token) {
    try {
        if (!token || !token.startsWith('Bearer ')) {
            return null;
        }

        const jwt = token.substring(7); // Quitar "Bearer "
        const secret = new TextEncoder().encode(CLERK_SECRET_KEY);
        
        try {
            const { payload } = await jwtVerify(jwt, secret);
            return {
                userId: payload.sub,
                email: payload.email,
                emailVerificado: payload.email_verified
            };
        } catch (error) {
            console.error('Error verificando JWT:', error);
            return null;
        }
    } catch (error) {
        console.error('Error en verificarClerkToken:', error);
        return null;
    }
}

// ===== OPERACIONES DE DATABASE =====

// 1. Obtener todos los posts visibles (público)
async function obtenerPosts() {
    try {
        const result = await pool.query(`
            SELECT id, user_id, user_email, categoria, mensaje, 
                   imagen_url, es_anonimo, is_verified, created_at
            FROM posts
            WHERE is_visible = true
            ORDER BY created_at DESC
            LIMIT 100
        `);
        return { success: true, posts: result.rows };
    } catch (error) {
        console.error('Error en obtenerPosts:', error);
        return { success: false, error: 'Error al obtener posts' };
    }
}

// 2. Obtener todos los posts (solo admin)
async function obtenerTodosPosts() {
    try {
        const result = await pool.query(`
            SELECT id, user_id, user_email, categoria, mensaje, 
                   imagen_url, es_anonimo, is_verified, is_visible, created_at
            FROM posts
            ORDER BY created_at DESC
            LIMIT 500
        `);
        return { success: true, posts: result.rows };
    } catch (error) {
        console.error('Error en obtenerTodosPosts:', error);
        return { success: false, error: 'Error al obtener posts' };
    }
}

// 2.5. Obtener estadísticas (público)
async function obtenerEstadisticas() {
    try {
        // Posts de los últimos 7 días
        const weekResult = await pool.query(`
            SELECT COUNT(*) as count
            FROM posts
            WHERE created_at >= NOW() - INTERVAL '7 days'
            AND is_visible = true
        `);
        
        // Total de posts históricos
        const totalResult = await pool.query(`
            SELECT COUNT(*) as count
            FROM posts
            WHERE is_visible = true
        `);
        
        return {
            success: true,
            weeklyCount: parseInt(weekResult.rows[0].count),
            totalCount: parseInt(totalResult.rows[0].count)
        };
    } catch (error) {
        console.error('Error en obtenerEstadisticas:', error);
        return { success: false, error: 'Error al obtener estadísticas' };
    }
}

// 3. Crear nuevo post
async function crearPost(usuario, datos) {
    try {
        const { categoria, mensaje, telefono, imagen_url, es_anonimo } = datos;

        // Validaciones
        if (!categoria || !mensaje || !telefono) {
            return { success: false, error: 'Faltan campos requeridos' };
        }

        if (mensaje.length > 500) {
            return { success: false, error: 'El mensaje es muy largo (máx 500 caracteres)' };
        }

        const result = await pool.query(`
            INSERT INTO posts 
            (user_id, user_email, categoria, mensaje, telefono, imagen_url, es_anonimo, is_verified, is_visible)
            VALUES ($1, $2, $3, $4, $5, $6, $7, false, true)
            RETURNING id, user_id, user_email, categoria, mensaje, imagen_url, es_anonimo, is_verified, created_at
        `, [
            usuario.userId,
            usuario.email,
            categoria,
            mensaje,
            telefono,
            imagen_url || null,
            es_anonimo || false
        ]);

        // Devolver el post incluyendo el teléfono (necesario para WhatsApp)
        const post = result.rows[0];
        post.telefono = telefono; // Agregar teléfono para uso en frontend

        return { success: true, post };
    } catch (error) {
        console.error('Error en crearPost:', error);
        return { success: false, error: 'Error al crear el post' };
    }
}

// 4. Eliminar post (solo propietario)
async function eliminarPost(usuario, postId) {
    try {
        const result = await pool.query(`
            DELETE FROM posts
            WHERE id = $1 AND user_id = $2
            RETURNING id
        `, [postId, usuario.userId]);

        if (result.rows.length === 0) {
            return { success: false, error: 'No tienes permiso para eliminar este post' };
        }

        return { success: true, postId };
    } catch (error) {
        console.error('Error en eliminarPost:', error);
        return { success: false, error: 'Error al eliminar el post' };
    }
}

// 5. Marcar como verificado (solo admin)
async function marcarVerificado(postId, verificado) {
    try {
        const result = await pool.query(`
            UPDATE posts
            SET is_verified = $1
            WHERE id = $2
            RETURNING id
        `, [verificado, postId]);

        if (result.rows.length === 0) {
            return { success: false, error: 'Post no encontrado' };
        }

        return { success: true, postId };
    } catch (error) {
        console.error('Error en marcarVerificado:', error);
        return { success: false, error: 'Error al actualizar el post' };
    }
}

// 6. Cambiar visibilidad (solo admin)
async function cambiarVisibilidad(postId, visible) {
    try {
        const result = await pool.query(`
            UPDATE posts
            SET is_visible = $1
            WHERE id = $2
            RETURNING id
        `, [visible, postId]);

        if (result.rows.length === 0) {
            return { success: false, error: 'Post no encontrado' };
        }

        return { success: true, postId };
    } catch (error) {
        console.error('Error en cambiarVisibilidad:', error);
        return { success: false, error: 'Error al actualizar el post' };
    }
}

// 7. Eliminar post (admin)
async function eliminarPostAdmin(postId) {
    try {
        const result = await pool.query(`
            DELETE FROM posts
            WHERE id = $1
            RETURNING id
        `, [postId]);

        if (result.rows.length === 0) {
            return { success: false, error: 'Post no encontrado' };
        }

        return { success: true, postId };
    } catch (error) {
        console.error('Error en eliminarPostAdmin:', error);
        return { success: false, error: 'Error al eliminar el post' };
    }
}

// ===== HANDLER PRINCIPAL =====
async function handler(req, res) {
    // Headers CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Content-Type', 'application/json');

    // Manejar preflight CORS
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        const { action, ...datos } = req.body || {};

        // ===== ACCIONES PÚBLICAS =====
        if (action === 'GET_POSTS') {
            const resultado = await obtenerPosts();
            return res.status(200).json(resultado);
        }

        if (action === 'GET_STATS') {
            const resultado = await obtenerEstadisticas();
            return res.status(200).json(resultado);
        }

        // ===== TODAS LAS DEMÁS ACCIONES REQUIEREN AUTENTICACIÓN =====
        const token = req.headers.authorization || '';
        const usuario = await verificarClerkToken(token);

        if (!usuario) {
            return res.status(401).json({ success: false, error: 'No autenticado' });
        }

        // Acciones autenticadas
        if (action === 'CREATE_POST') {
            const resultado = await crearPost(usuario, datos);
            return res.status(resultado.success ? 201 : 400).json(resultado);
        }

        if (action === 'DELETE_POST') {
            const resultado = await eliminarPost(usuario, datos.post_id);
            return res.status(resultado.success ? 200 : 403).json(resultado);
        }

        // ===== ACCIONES SOLO ADMIN =====
        if (usuario.email !== ADMIN_EMAIL) {
            return res.status(403).json({ success: false, error: 'No tienes permisos de administrador' });
        }

        if (action === 'GET_ALL_POSTS') {
            const resultado = await obtenerTodosPosts();
            return res.status(200).json(resultado);
        }

        if (action === 'TOGGLE_VERIFIED') {
            const resultado = await marcarVerificado(datos.post_id, datos.verified);
            return res.status(200).json(resultado);
        }

        if (action === 'TOGGLE_VISIBLE') {
            const resultado = await cambiarVisibilidad(datos.post_id, datos.visible);
            return res.status(200).json(resultado);
        }

        if (action === 'ADMIN_DELETE_POST') {
            const resultado = await eliminarPostAdmin(datos.post_id);
            return res.status(resultado.success ? 200 : 404).json(resultado);
        }

        return res.status(400).json({ success: false, error: 'Acción no válida' });

    } catch (error) {
        console.error('Error general en handler:', error);
        return res.status(500).json({ success: false, error: 'Error interno del servidor' });
    }
}

// ===== EXPORTAR PARA NETLIFY/VERCEL =====

// Para Netlify Functions
exports.handler = async (event, context) => {
    const req = {
        method: event.httpMethod,
        headers: event.headers,
        body: event.body ? JSON.parse(event.body) : {}
    };

    let statusCode = 200;
    let body = '{}';
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

// Para Vercel Functions
module.exports = (req, res) => {
    handler(req, res);
};
