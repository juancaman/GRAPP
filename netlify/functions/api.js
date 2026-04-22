const { createClerkClient } = require('@clerk/backend');
const { neon } = require('@neondatabase/serverless');

const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
const sql = neon(process.env.DATABASE_URL);

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    let user = null;
    if (event.httpMethod !== 'GET' || event.queryStringParameters?.requireAuth) {
      const token = event.headers.authorization?.split(' ')[1];
      if (!token) return { statusCode: 401, headers, body: JSON.stringify({ error: 'No autorizado' }) };
      
      try {
        const session = await clerk.sessions.verifyToken(token, { authorizedParties: ['*'] });
        user = session;
      } catch (e) {
        return { statusCode: 401, headers, body: JSON.stringify({ error: 'Token inválido' }) };
      }
    }

    const body = event.body ? JSON.parse(event.body) : {};
    let result;

    if (event.httpMethod === 'GET') {
      const { category, get } = event.queryStringParameters;
      
      if (get === 'stats') {
        const stats = await sql`
          SELECT 
            (SELECT COUNT(*) FROM posts WHERE created_at > NOW() - INTERVAL '7 days') as weekly_posts,
            (SELECT COUNT(DISTINCT user_id) FROM posts) as total_users,
            (SELECT COUNT(*) FROM posts WHERE is_visible = true) as active_posts
        `;
        result = stats[0];
      } else {
        let query = sql`SELECT * FROM posts WHERE is_visible = true`;
        if (category && category !== 'all') {
          query = sql`SELECT * FROM posts WHERE is_visible = true AND category = ${category}`;
        }
        const posts = await query.order`created_at DESC`.limit(50);
        result = { posts };
      }

    } else if (event.httpMethod === 'POST') {
      if (!user) return { statusCode: 401, headers, body: JSON.stringify({ error: 'Debes iniciar sesión' }) };
      await sql`
        INSERT INTO posts (user_id, user_name, user_email, user_avatar, category, message, phone, image_url)
        VALUES (${user.userId}, ${user.firstName || user.emailAddresses[0].emailAddress}, ${user.emailAddresses[0].emailAddress}, ${user.imageUrl}, ${body.category}, ${body.message}, ${body.phone}, ${body.image_url})
      `;
      result = { message: 'Publicado con éxito' };

    } else if (event.httpMethod === 'DELETE') {
      if (!user) return { statusCode: 401, headers, body: JSON.stringify({ error: 'No autorizado' }) };
      const post = await sql`SELECT user_id FROM posts WHERE id = ${body.id}`;
      if (post.length === 0 || (post[0].user_id !== user.userId && user.emailAddresses[0].emailAddress !== process.env.VITE_ADMIN_EMAIL)) {
        return { statusCode: 403, headers, body: JSON.stringify({ error: 'No puedes eliminar esto' }) };
      }
      await sql`DELETE FROM posts WHERE id = ${body.id}`;
      result = { message: 'Eliminado' };

    } else if (event.httpMethod === 'PUT') {
      if (!user) return { statusCode: 401, headers, body: JSON.stringify({ error: 'No autorizado' }) };
      const post = await sql`SELECT user_id FROM posts WHERE id = ${body.id}`;
      if (post.length === 0 || post[0].user_id !== user.userId) {
        return { statusCode: 403, headers, body: JSON.stringify({ error: 'No puedes editar esto' }) };
      }
      await sql`
        UPDATE posts SET category = ${body.category}, message = ${body.message}, phone = ${body.phone}, image_url = ${body.image_url}
        WHERE id = ${body.id}
      `;
      result = { message: 'Actualizado' };
    
    } else if (event.httpMethod === 'PATCH') {
      if (!user || user.emailAddresses[0].emailAddress !== process.env.VITE_ADMIN_EMAIL) {
        return { statusCode: 403, headers, body: JSON.stringify({ error: 'Solo admins' }) };
      }
      if (body.action === 'toggle_visibility') await sql`UPDATE posts SET is_visible = NOT is_visible WHERE id = ${body.id}`;
      else if (body.action === 'toggle_verified') await sql`UPDATE posts SET is_verified = NOT is_verified WHERE id = ${body.id}`;
      result = { message: 'Acción de admin completada' };
    }

    return { statusCode: 200, headers, body: JSON.stringify(result) };

  } catch (error) {
    console.error(error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
  }
};