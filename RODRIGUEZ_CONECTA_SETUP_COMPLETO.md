# 🏘️ Rodríguez Conecta - Guía de Setup Seguro

## 📋 Tabla de Contenidos
1. [Requisitos Previos](#requisitos-previos)
2. [Setup Base de Datos (Neon)](#setup-base-de-datos-neon)
3. [Setup Autenticación (Clerk)](#setup-autenticación-clerk)
4. [Setup Imágenes (ImgBB)](#setup-imágenes-imgbb)
5. [Despliegue (Netlify/Vercel)](#despliegue-netlifyfvercel)
6. [Arquitectura de Seguridad](#arquitectura-de-seguridad)
7. [Testing & Troubleshooting](#testing--troubleshooting)

---

## Requisitos Previos

- Node.js 18+ instalado
- Cuenta en Neon (https://neon.tech)
- Cuenta en Clerk (https://clerk.com)
- Cuenta en ImgBB (https://imgbb.com)
- Cuenta en Netlify O Vercel
- Git instalado

---

## Setup Base de Datos (Neon)

### 1. Crear Proyecto en Neon

1. Ir a [neon.tech](https://neon.tech) y crear cuenta
2. Dashboard → "New Project" → "Create Project"
3. Nombre: `rodriguez-conecta`
4. Region: Latinoamérica recomendada
5. Copiar la **Connection String** (guárdalo en seguro)

### 2. Crear Tabla y Schema

1. En Neon Dashboard, ir a "SQL Editor"
2. Ejecutar este SQL **completo**:

```sql
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

-- Crear índices
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_category ON posts(category);
CREATE INDEX idx_posts_is_visible ON posts(is_visible);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);

-- Insertar datos de prueba (OPCIONAL)
INSERT INTO posts (user_id, user_email, category, message, is_verified, is_visible)
VALUES 
    ('user_123', 'test@example.com', 'precios', 'Leche a $80 en Almacén García', true, true),
    ('user_456', 'vecino@example.com', 'seguridad', 'Se vio sospechoso anoche en la estación', false, true);
```

3. Click "Execute" ✅

### 3. Verificar Conexión

En terminal:
```bash
# Instalar cliente psql (si no lo tienes)
# macOS: brew install postgresql
# Windows: https://www.postgresql.org/download/windows/
# Linux: sudo apt install postgresql-client

psql YOUR_CONNECTION_STRING -c "SELECT * FROM posts;"
```

Debería retornar 2 filas de datos de prueba.

---

## Setup Autenticación (Clerk)

### 1. Crear App en Clerk

1. Ir a [clerk.com](https://clerk.com) y registrarse
2. Dashboard → "New Application"
3. Nombre: `rodriguez-conecta`
4. Seleccionar: **Email/Password** (auth method)
5. Crear

### 2. Obtener Credenciales

En Clerk Dashboard:

1. **CLERK_PUBLISHABLE_KEY**: 
   - Settings → API Keys → "Copy Publishable Key"
   
2. **CLERK_SECRET_KEY**: 
   - Settings → API Keys → "Copy Secret Key"

3. **Frontend URL** (para cors):
   - Settings → Domains → Agregar tu dominio/localhost

### 3. Configurar Permitidos

Settings → Sign-up & Sign-in → **Email/Password habilitado**

---

## Setup Imágenes (ImgBB)

### 1. Obtener API Key

1. Ir a [imgbb.com](https://imgbb.com) y crear cuenta
2. Sign In → Settings → "API"
3. Copiar **API Key**

### 2. Notas Importantes

- **Límite**: 32 MB por imagen (publica)
- **Almacenamiento**: Gratuito, pero con límite de 200 uploads/hora
- **Alternativas**: Si necesitas más, considera:
  - Cloudinary (https://cloudinary.com) - Gratuito hasta 25GB
  - AWS S3 - Más complejo pero escalable
  - Vercel Blob (si usas Vercel)

---

## Despliegue (Netlify/Vercel)

### Opción A: Netlify (RECOMENDADO para principiantes)

#### 1. Setup Proyecto Localmente

```bash
# 1. Clonar/descargar repo
cd rodriguez-conecta

# 2. Crear archivo .env.local
touch .env.local

# 3. Agregar variables
cat > .env.local << 'EOF'
DATABASE_URL=postgresql://user:password@host/dbname
CLERK_PUBLISHABLE_KEY=pk_test_XXXXXXXXXX
CLERK_SECRET_KEY=sk_test_XXXXXXXXXX
VITE_IMGBB_KEY=xxxxxxxxxxxxxxxx
VITE_ADMIN_EMAIL=tuemailadmin@gmail.com
EOF
```

#### 2. Instalar Dependencias

```bash
npm install
npm install @neondatabase/serverless jose
```

#### 3. Crear netlify.toml

```toml
[build]
  command = "npm run build"
  functions = "api"
  publish = "dist"

[build.environment]
  NODE_VERSION = "18"

[context.production.environment]
  DATABASE_URL = "postgresql://..."
  CLERK_SECRET_KEY = "sk_test_..."

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200
```

#### 4. Instalar CLI de Netlify

```bash
npm install -g netlify-cli
```

#### 5. Conectar a Netlify

```bash
netlify login
netlify link  # Crear nuevo site
netlify deploy --prod
```

**Nota**: Antes de `--prod`, Netlify sugiere un "Draft Deploy" para testing.

### Opción B: Vercel (más rápido)

#### 1. Instalar CLI

```bash
npm install -g vercel
```

#### 2. Deployar

```bash
vercel
# Sigue el asistente interactivo
# En "Are you in the right directory?": Yes
# En "Link to existing Project?": No (crear nuevo)
```

#### 3. Agregar Variables de Entorno

En Vercel Dashboard:
- Proyecto → Settings → Environment Variables
- Agregar todas las variables del `.env.local`

---

## Configuración Frontend (index.html)

### 1. Actualizar Variables

En `index.html`, buscar línea:

```javascript
const API_URL = '/api/db';
const IMGBB_KEY = '';
const ADMIN_EMAIL = 'admin@example.com';
```

Reemplazar:

```javascript
const API_URL = 'https://tu-dominio.netlify.app/api/db'; // o vercel.app
const IMGBB_KEY = 'xxxxxxxxxxxxxxxx'; // Tu API Key de ImgBB
const ADMIN_EMAIL = 'tuemailadmin@gmail.com'; // Tu email
```

**IMPORTANTE**: 
- En desarrollo: `const API_URL = '/api/db';` (proxy local)
- En producción: `const API_URL = 'https://tu-dominio.com/api/db';`

### 2. Integrar Clerk (ya está en HTML)

El HTML ya tiene:
```html
<script async src="https://cdn.clerk.com/clerk.browser.js"></script>
```

Que automaticamente se conecta con tu Clerk app.

---

## Panel Admin (`?admin=true`)

### Acceso

1. URL con query param: `https://tu-dominio.com?admin=true`
2. Automáticamente verifica que `user.email === ADMIN_EMAIL`
3. Muestra tabla con:
   - **Verificar**: Marcar como "Post verificado" (muestra ✓)
   - **Ocultar**: Esconder del feed público
   - **Eliminar**: Borrar permanentemente

### Permisos

Solo el email admin puede:
- Ver panel admin
- Acceder a GET_ALL_POSTS
- Hacer TOGGLE_VERIFIED, TOGGLE_VISIBLE
- ADMIN_DELETE_POST

---

## Arquitectura de Seguridad

### 🔒 1. Teléfono Oculto

**Problema**: Exponer números en el DOM permite scraping

**Solución**:
- Número almacenado ENCRIPTADO en Neon (opcional, actual: plain)
- Frontend NUNCA renderiza el número en HTML
- Al hacer clic "Contactar": genera URL `wa.me/NUMERO` solo en memor javascript
- Número jamás pasa por DOM (no visible en inspector)

**Código**:
```javascript
async function contactWhatsApp(postId) {
    const post = allPosts.find(p => p.id === postId);
    // post.phone existe en memoria JS, no en DOM
    const phoneNumber = post.phone.replace(/\D/g, ''); // Solo dígitos
    const waUrl = `https://wa.me/${phoneNumber}?text=...`; // Genera URL
    window.open(waUrl, '_blank'); // Abre WhatsApp
}
```

### 📧 2. Autenticación Clerk

**Flujo**:
1. Usuario hace login con email/password en Clerk Modal
2. Clerk genera JWT (token) firmado
3. Frontend almacena token en `Clerk.session`
4. En cada request: `Authorization: Bearer <JWT>`

**Validación Backend**:
```javascript
const user = await verifyClerkToken(authHeader);
if (!user) return response(401, { error: 'No autenticado' });
```

**Ventajas**:
- Clerk maneja hashing de passwords
- 2FA/MFA opcional
- Recuperación de contraseña automática
- No expones credenciales

### 🗝️ 3. Database URL Protegida

**NUNCA en Frontend**:
```javascript
// ❌ MALO
const pool = new Pool({ connectionString: '...' }); // En JS
```

**Correcto** (Backend serverless):
```javascript
// ✅ BUENO
// api/db.js usa process.env.DATABASE_URL
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
```

### 👤 4. Ownership Validation

```sql
-- Eliminar solo propio post
DELETE FROM posts WHERE id = $1 AND user_id = $2;

-- Admin puede eliminar cualquiera
DELETE FROM posts WHERE id = $1; -- Sin WHERE user_id
```

### 📋 5. Admin Email Whitelist

```javascript
const isAdmin = user.email === ADMIN_EMAIL;

if (!isAdmin) {
    return response(403, { error: 'No es admin' });
}
```

### 🛡️ 6. CORS + HTTPS

**Netlify/Vercel automáticamente**:
- HTTPS forzado
- CORS headers configurados
- Rate limiting en serverless functions

---

## Testing & Troubleshooting

### ✅ Checklist de Verificación

#### 1. Base de Datos

```bash
# Conectar a Neon
psql $DATABASE_URL

# Listar tablas
\dt

# Ver posts
SELECT * FROM posts;
```

#### 2. Clerk Auth

```javascript
// En consola del navegador
Clerk.user
// Debería retornar objeto con id, email, etc.
```

#### 3. ImgBB

```bash
# Test API (reemplaza tu clave)
curl -X POST https://api.imgbb.com/1/upload?key=YOUR_KEY \
  -F "image=@test.jpg"
```

#### 4. Serverless Function

```bash
# Netlify: ver logs
netlify logs --function db

# Vercel: ver logs en Dashboard → Functions
```

### ❌ Errores Comunes

| Error | Causa | Solución |
|-------|-------|----------|
| `401 Unauthorized` | JWT inválido | Verifica CLERK_SECRET_KEY está bien configurada |
| `Connection refused` | DB URL inválida | Copia CONNECTION STRING de Neon sin comillas |
| `CORS error` | Headers no configurados | Los servers (Netlify/Vercel) lo manejan auto |
| `Foto no sube` | ImgBB key incorrecta | Verifica en dashboard ImgBB settings |
| `Admin panel no aparece` | Email no coincide | VITE_ADMIN_EMAIL en env vars exacto |
| `POST falla silenciosamente` | Validación de malas palabras | Revisa array `badWords` en `submitPost()` |

---

## 🚀 Deploy Checklist

```
[ ] Neon DB creada con tabla posts
[ ] CLERK_PUBLISHABLE_KEY copiado
[ ] CLERK_SECRET_KEY copiado
[ ] ImgBB API Key obtenida
[ ] Admin email definido en .env
[ ] index.html actualizado con variables
[ ] api/db.js desplegado en Netlify/Vercel
[ ] Variables de env configuradas en plataforma
[ ] Test login en Clerk
[ ] Test crear post con foto
[ ] Test panel admin con admin email
[ ] Test contactar (WhatsApp)
[ ] Test eliminar propio post
[ ] Verificar teléfono NO en DOM (inspector)
```

---

## 📞 Quick Reference - Variables de Entorno

```env
# Neon
DATABASE_URL=postgresql://username:password@ep-xxxxx-xxxxx.neon.tech/neon

# Clerk
CLERK_PUBLISHABLE_KEY=pk_live_XXXXXXXXXX
CLERK_SECRET_KEY=sk_live_XXXXXXXXXX

# ImgBB
VITE_IMGBB_KEY=xxxxxxxxxxxxxxxxxxxxxxxx

# Admin
VITE_ADMIN_EMAIL=admin@tudominio.com

# Frontend (opcional)
VITE_API_URL=https://tu-dominio.com/api/db
```

---

## 📖 Recursos Útiles

- [Neon Docs](https://neon.tech/docs)
- [Clerk Docs](https://clerk.com/docs)
- [Netlify Functions](https://docs.netlify.com/functions/overview/)
- [Vercel Serverless](https://vercel.com/docs/functions)
- [ImgBB API](https://api.imgbb.com/)

---

## ⚙️ Próximos Pasos Opcionales

1. **Encriptación de Teléfonos**: Usar `crypto` para encriptar números
2. **Rate Limiting**: Limitar posts por usuario/hora
3. **Moderación Automática**: Usar IA para detectar spam
4. **Analytics**: Trackear posts, usuarios activos
5. **Mobile App**: Convertir a React Native/Flutter
6. **Push Notifications**: Alertas en tiempo real
7. **Monetización**: Ads, featured posts

---

**Versión**: 1.0  
**Última actualización**: 2026  
**Mantenedor**: Tu equipo  
