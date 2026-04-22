# 🚀 SQL SCHEMA - Rodríguez Conecta (Neon)

## ⚠️ COPIAR Y PEGAR EN NEON Console

Accede a: https://console.neon.tech → Tu proyecto → SQL Editor

Pega esto completo:

```sql
-- ===== CREAR TABLA POSTS =====
CREATE TABLE IF NOT EXISTS posts (
    id BIGSERIAL PRIMARY KEY,
    categoria VARCHAR(50) NOT NULL CHECK (categoria IN ('precios', 'seguridad', 'servicios', 'basural')),
    mensaje TEXT NOT NULL,
    image_url TEXT,
    phone_hash VARCHAR(255) NOT NULL, -- SHA256 del teléfono, nunca exponer
    author_id VARCHAR(255) NOT NULL, -- ID de Clerk
    author_email VARCHAR(255) NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    is_hidden BOOLEAN DEFAULT FALSE,
    is_visible BOOLEAN DEFAULT TRUE, -- Soft delete
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===== ÍNDICES PARA PERFORMANCE =====
CREATE INDEX idx_posts_categoria ON posts(categoria);
CREATE INDEX idx_posts_author_id ON posts(author_id);
CREATE INDEX idx_posts_is_hidden ON posts(is_hidden);
CREATE INDEX idx_posts_is_visible ON posts(is_visible);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);

-- ===== SEED DATA (OPCIONAL) =====
-- Para testing, agregar un admin post
INSERT INTO posts (categoria, mensaje, phone_hash, author_id, author_email, is_verified, is_visible)
VALUES (
    'precios',
    'Bienvenidos a Rodríguez Conecta. Este es un aviso de demostración.',
    'd41d8cd98f00b204e9800998ecf8427e', -- hash de "demo"
    'clerk_test_user',
    'demo@test.com',
    true,
    true
);

-- ===== POLÍTICAS DE SEGURIDAD (NoSQL-like, para referencia) =====
-- Nota: Neon/PostgreSQL no tiene RLS nativo como Supabase.
-- La seguridad se implementa en la función serverless (api/db.js)
-- con validación de Clerk tokens y email del admin.

-- ===== TABLA DE AUDITORÍA (OPCIONAL) =====
CREATE TABLE IF NOT EXISTS audit_log (
    id BIGSERIAL PRIMARY KEY,
    action VARCHAR(50) NOT NULL, -- create, delete, update, admin_action
    post_id BIGINT REFERENCES posts(id) ON DELETE SET NULL,
    actor_id VARCHAR(255), -- ID de Clerk del que hizo la acción
    actor_email VARCHAR(255),
    details JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_created_at ON audit_log(created_at DESC);
```

---

## ✅ VERIFICAR

Después de ejecutar, debería ver:

```
✅ CREATE TABLE
✅ CREATE INDEX
✅ INSERT 0 1
```

Si hay errores, revisa que no existe la tabla antes (DROP TABLE posts; antes de agregar si quieres reset).

---

## 🔐 NOTAS DE SEGURIDAD

1. **phone_hash**: SHA256 del número, NUNCA revertible. Solo para comparar si es necesario.
2. **author_id/author_email**: Viene del token de Clerk, validado en la función serverless.
3. **is_hidden**: Admin puede ocultar posts (soft delete).
4. **is_visible**: Para futuros soft deletes.
5. **Sin RLS**: La seguridad está en el backend serverless, no en BD.

---

## 📊 ESTRUCTURA DE DATOS

```
posts
├─ id: BIGINT (PK)
├─ categoria: VARCHAR (precios|seguridad|servicios|basural)
├─ mensaje: TEXT (<=500 chars)
├─ image_url: TEXT (URL pública de ImgBB)
├─ phone_hash: VARCHAR (SHA256, nunca exponer)
├─ author_id: VARCHAR (de Clerk)
├─ author_email: VARCHAR (de Clerk)
├─ is_verified: BOOLEAN (admin verification)
├─ is_hidden: BOOLEAN (admin hide)
├─ is_visible: BOOLEAN (soft delete)
├─ created_at: TIMESTAMP
└─ updated_at: TIMESTAMP
```

---

## 🧪 TESTING

Para verificar que todo funciona:

```sql
SELECT * FROM posts;
```

Debería mostrar 1 row (el seed).

Para limpiar (si necesitas reset):

```sql
TRUNCATE posts CASCADE;
```

---

## 🚀 PRÓXIMOS PASOS

1. Pegar este SQL en Neon
2. Obtener `DATABASE_URL` (connection string)
3. Crear función serverless con `api/db.js`
4. Desplegar en Netlify o Vercel

¡Listo! 🎉
