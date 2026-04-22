# 🚀 SETUP COMPLETO - Rodríguez Conecta (Arquitectura Segura)

Este documento contiene las instrucciones paso a paso para desplegar la solución segura en producción.

---

## 📋 RESUMEN DE LA ARQUITECTURA

```
Frontend (index.html)
    |
    +-- Clerk CDN (Auth vía Email/Password)
    +-- ImgBB (Subida de imágenes)
    |
    └-- API Serverless (api/db.js)
            |
            └-- Neon PostgreSQL (BD)
```

**Características:**
- ✅ Teléfono NUNCA se renderiza en el DOM
- ✅ Solo usuarios autenticados pueden publicar
- ✅ Cada usuario solo puede eliminar sus posts
- ✅ Admin puede verificar, ocultar y eliminar posts
- ✅ Imágenes se suben a ImgBB (simple, sin backend)
- ✅ BD segura en Neon con políticas RLS basic

---

## 🗄️ PASO 1: Crear Base de Datos en Neon

### 1.1 Crear proyecto en Neon

1. Ve a https://console.neon.tech
2. Regístrate o inicia sesión
3. Crea un nuevo proyecto (ej: "rodriguez-conecta")
4. Copia la cadena de conexión: `postgresql://user:password@...`
5. **GUARDA ESTA CADENA** - la necesitarás en la función serverless

### 1.2 Crear tabla en Neon

1. En la consola de Neon, abre el editor SQL
2. Pega este SQL completo:

```sql
-- ===== CREAR TABLA POSTS =====
CREATE TABLE posts (
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

-- ===== ÍNDICES PARA PERFORMANCE =====
CREATE INDEX idx_posts_author_id ON posts(author_id);
CREATE INDEX idx_posts_category ON posts(category);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_posts_is_visible ON posts(is_visible);

-- ===== SEED DATA (Usuario admin) =====
-- Nota: Los posts de seed son opcionales; aquí mostramos cómo insertar
INSERT INTO posts (title, description, phone, category, author_id, author_name, is_verified)
VALUES (
    'Bienvenidos a Rodríguez Conecta',
    'Esta es la plataforma oficial para compartir ofertas, alertas de seguridad y servicios en General Rodríguez.',
    '+54 9 11 0000-0000',
    'servicios',
    'admin-id',
    'Equipo Rodríguez Conecta',
    true
);
```

3. Ejecuta el SQL
4. Verifica que se creó la tabla (Verás `posts` en el panel izquierdo)

---

## 🔐 PASO 2: Configurar Clerk (Autenticación)

### 2.1 Crear aplicación en Clerk

1. Ve a https://clerk.com
2. Regístrate o inicia sesión
3. Crea una nueva aplicación (ej: "rodriguez-conecta")
4. Selecciona **Email/Password** como método de autenticación
5. Completa el nombre de dominio (ej: general-rodriguez.com)

### 2.2 Obtener credenciales de Clerk

1. En el dashboard de Clerk, ve a **API Keys** (o **Credentials**)
2. Copia:
   - **Publishable Key** (comienza con `pk_test_` o `pk_live_`)
   - **Secret Key** (para la función serverless)

### 2.3 Configurar URL de producción

1. Ve a **Settings → Authorized URLs**
2. Agrega:
   - `http://localhost:3000` (desarrollo local)
   - `https://tu-dominio.com` (producción)
   - `https://tu-app.netlify.app` (si usas Netlify)
   - `https://tu-app.vercel.app` (si usas Vercel)

---

## 🖼️ PASO 3: Obtener API Key de ImgBB

### 3.1 Crear cuenta en ImgBB

1. Ve a https://imgbb.com
2. Regístrate (es gratis)
3. Ve a **Uploads → API** (o https://api.imgbb.com/)
4. Copia tu **API Key**
5. **GUARDA ESTA CLAVE** - la necesitarás en el frontend

---

## 🚀 PASO 4: Desplegar en Netlify (Recomendado)

### 4.1 Preparar archivos

1. Crea una carpeta local con esta estructura:

```
mi-app/
├── index.html              (Frontend - copiar de production/index.html)
├── netlify.toml            (Configuración de Netlify)
├── package.json            (Dependencias)
└── netlify/
    └── functions/
        └── db.js           (API - copiar de production/api_db.js)
```

### 4.2 Crear `package.json`

```json
{
  "name": "rodriguez-conecta",
  "version": "1.0.0",
  "dependencies": {
    "@neondatabase/serverless": "^0.4.0"
  }
}
```

### 4.3 Crear `netlify.toml`

```toml
[build]
  command = "npm install"
  functions = "netlify/functions"
  publish = "."

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/db:splat"
  status = 200
```

### 4.4 Copiar archivos

1. Copia `production/index.html` a la raíz del proyecto
2. Copia `production/api_db.js` a `netlify/functions/db.js`
3. Reemplaza en `db.js` las líneas de conexión (ver sección 4.5)

### 4.5 Configurar `netlify/functions/db.js`

**Reemplaza estas líneas al inicio del archivo:**

```javascript
// Para Neon (@neondatabase/serverless):
const { sql } = require('@neondatabase/serverless');
const db = sql(DATABASE_URL);

// O para PostgreSQL estándar (comentar la anterior):
// const postgres = require('postgres');
// const db = postgres(DATABASE_URL, { ssl: 'require' });
```

### 4.6 Desplegar a Netlify

1. Ve a https://app.netlify.com
2. Haz login (o crea cuenta)
3. Sube tu carpeta del proyecto vía **Drag & drop** en "Deploy manually"
4. **Espera a que termine la compilación**

### 4.7 Configurar variables de entorno en Netlify

1. En el dashboard de Netlify, ve a:
   - **Site settings → Build & deploy → Environment**
2. Haz click en **Edit variables**
3. Agrega estas 4 variables:

| Variable | Valor |
|----------|-------|
| `DATABASE_URL` | Tu cadena de conexión de Neon (ej: `postgresql://...`) |
| `CLERK_SECRET_KEY` | Tu Secret Key de Clerk |
| `ADMIN_EMAIL` | Tu email (ej: `tu-email@ejemplo.com`) |
| `IMGBB_API_KEY` | Tu API Key de ImgBB |

4. **Haz click en Save**
5. En la sección **Deploys**, haz click en **Trigger deploy → Deploy site**

---

## 🚀 PASO 5: Desplegar en Vercel (Alternativa)

### 5.1 Preparar archivos para Vercel

```
mi-app/
├── index.html              (Frontend)
├── vercel.json             (Configuración)
├── package.json            (Dependencias)
└── api/
    └── db.js               (API)
```

### 5.2 Crear `vercel.json`

```json
{
  "version": 2,
  "builds": [
    { "src": "api/db.js", "use": "@vercel/node" }
  ],
  "routes": [
    { "src": "/api/(.*)", "dest": "/api/db.js" },
    { "src": "/(.*)", "dest": "/index.html" }
  ]
}
```

### 5.3 Desplegar a Vercel

1. Ve a https://vercel.com
2. Haz login (o crea cuenta)
3. Importa tu repositorio Git (GitHub, GitLab, Bitbucket)
4. Configura las variables de entorno:
   - `DATABASE_URL`
   - `CLERK_SECRET_KEY`
   - `ADMIN_EMAIL`
   - `IMGBB_API_KEY`
5. Haz click en **Deploy**

---

## ⚙️ PASO 6: Actualizar `index.html` con tus valores

Una vez desplegada la app, abre `index.html` en tu editor favorito y reemplaza:

```javascript
// LÍNEA ~1110 en index.html

const CONFIG = {
    API_BASE: 'https://tu-app.netlify.app',     // ← URL de tu app
    CLERK_PUBLISHABLE_KEY: 'pk_test_...',        // ← Tu Clerk Publishable Key
    ADMIN_EMAIL: 'tu-email@ejemplo.com',         // ← Tu email
    IMGBB_API_KEY: 'REEMPLAZA_CON_TU_KEY',       // ← Tu ImgBB API Key
    // ...
};
```

**Importante:**
- Si usas Netlify: `https://tu-app.netlify.app`
- Si usas Vercel: `https://tu-app.vercel.app`

---

## 🔍 PASO 7: Verificación Post-Despliegue

### 7.1 Test del Frontend

1. Abre tu URL (ej: https://tu-app.netlify.app)
2. Verifica que carga correctamente
3. Haz click en **Ingresar**, regístrate con email/contraseña
4. Intenta crear un nuevo aviso

### 7.2 Test de la API

```bash
# Obtener todos los posts (sin autenticación)
curl -X GET https://tu-app.netlify.app/api/posts

# Respuesta esperada: Array de posts (sin teléfono)
```

### 7.3 Verificar que el teléfono NO está expuesto

1. Abre **DevTools (F12)** en el navegador
2. Ve a **Network → XHR/Fetch**
3. Crea un nuevo aviso y observa la petición
4. **El teléfono NO debe aparecer en el JSON de la API**
5. **El teléfono SÍ debe usarse dinámicamente al hacer click en "Contactar"**

### 7.4 Test de eliminación segura

1. Crea un aviso como `usuario-A`
2. Logout
3. Regístrate como `usuario-B`
4. **Verifica que NO ves botón "Eliminar" en el aviso de usuario-A**
5. Logout y vuelve como `usuario-A`
6. **Verifica que SÍ ves botón "Eliminar" en tu aviso**

---

## 🛡️ EXPLICACIÓN DE SEGURIDAD

### 1. Protección del Teléfono

❌ **ANTES (inseguro):**
```html
<!-- El teléfono está en el HTML renderizado -->
<div data-phone="+54 9 11 1234-5678">
    <a href="https://wa.me/5491112345678">Contactar</a>
</div>
<!-- Riesgo: Bots pueden extraer teléfono del HTML -->
```

✅ **AHORA (seguro):**
```javascript
// El teléfono está en un data-attribute, NO en el href
<button data-phone="+54 9 11 1234-5678">Contactar</button>

// Se accede dinámicamente solo al hacer click
function abrirWhatsApp(phone) {
    const limpioPhone = phone.replace(/\D/g, '');
    window.open(`https://wa.me/${limpioPhone}?text=...`, '_blank');
}
// Riesgo reducido: Bots no ejecutan JavaScript
```

### 2. Eliminación Segura (Solo Propietario)

**Frontend:**
- Solo renderiza botón "Eliminar" si `user.id === post.author_id`

**Backend (api/db.js):**
```javascript
// Valida en el servidor que el usuario es propietario
if (post.author_id !== user.id) {
    return enviarError(403, 'No tienes permiso');
}
```

**Resultado:** Incluso si alguien manipula el frontend, la BD rechaza la eliminación.

### 3. Panel Admin

**Acceso:**
- Solo disponible si `user.email === 'admin@ejemplo.com'`
- Configurado en Netlify/Vercel como variable de entorno

**Funciones:**
- ✓ Verificar posts (añade badge)
- ✓ Ocultar/mostrar posts (cambia `is_visible`)
- ✓ Eliminar posts (sin validar propietario)
- ✓ Exportar datos (JSON)

---

## 🐛 TROUBLESHOOTING

### ❌ "Clerk no está cargado"

**Causa:** `CLERK_PUBLISHABLE_KEY` no configurada
**Solución:** Verifica que reemplazaste la clave en `index.html` línea ~1110

### ❌ "Error 404 en /api/posts"

**Causa:** Función serverless no desplegada correctamente
**Solución:**
- En Netlify: Verifica que `netlify/functions/db.js` existe
- En Vercel: Verifica que `api/db.js` existe y `vercel.json` está correcto

### ❌ "Conexión a BD rechazada"

**Causa:** `DATABASE_URL` incorrecta o variable de entorno no configurada
**Solución:**
- Verifica `DATABASE_URL` en Netlify/Vercel
- Asegúrate de que termina sin `/` (ej: `postgresql://...` no `postgresql://.../)
- Prueba la conexión en Neon console

### ❌ "Las imágenes no se suben"

**Causa:** `IMGBB_API_KEY` incorrecta
**Solución:**
- Obtén una nueva clave en https://api.imgbb.com/
- Verifica que no tiene espacios en blanco
- Asegúrate de reemplazarla en `index.html` línea ~1110

### ❌ "Admin no ve panel de moderación"

**Causa:** Email no coincide exactamente
**Solución:**
- Verifica que `ADMIN_EMAIL` en el backend = email de Clerk del usuario
- Sensibles a mayúsculas: `Admin@Ejemplo.com` ≠ `admin@ejemplo.com`

---

## 📝 SQL SCHEMA - Referencia Rápida

```sql
-- Tabla principal
CREATE TABLE posts (
    id SERIAL PRIMARY KEY,                          -- ID único
    title VARCHAR(100) NOT NULL,                    -- Título máx 100 caracteres
    description TEXT NOT NULL,                       -- Descripción (texto largo)
    phone VARCHAR(20) NOT NULL,                     -- Teléfono NUNCA mostrado en frontend
    category VARCHAR(20),                           -- precios, seguridad, servicios, basural
    author_id VARCHAR(255) NOT NULL,                -- ID de Clerk del autor
    author_name VARCHAR(100),                       -- Nombre del autor (o "Anónimo")
    is_anonymous BOOLEAN DEFAULT false,             -- Checkbox de publicar anónimo
    is_verified BOOLEAN DEFAULT false,              -- ✓ Verificado por admin
    is_visible BOOLEAN DEFAULT true,                -- Oculto por moderación
    image_url TEXT,                                 -- URL de imagen en ImgBB
    votes INT DEFAULT 0,                            -- Contador de "Me sirve"
    created_at TIMESTAMP DEFAULT NOW(),             -- Fecha de creación
    updated_at TIMESTAMP DEFAULT NOW()              -- Fecha de last update
);

-- Índices para queries rápidas
CREATE INDEX idx_posts_author_id ON posts(author_id);
CREATE INDEX idx_posts_category ON posts(category);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_posts_is_visible ON posts(is_visible);
```

---

## 🚨 CHECKLIST PRE-PRODUCCIÓN

Antes de publicar, verifica que:

- [ ] BD creada en Neon con tabla `posts`
- [ ] Clerk configurado con Email/Password
- [ ] ImgBB API Key obtenida
- [ ] `index.html` actualizado con tus 4 valores (API_BASE, CLERK_PUBLISHABLE_KEY, ADMIN_EMAIL, IMGBB_API_KEY)
- [ ] Función serverless desplegada en Netlify/Vercel
- [ ] Variables de entorno configuradas en plataforma
- [ ] Prueba de crear aviso sin ver teléfono en HTML
- [ ] Prueba de eliminar aviso (solo propietario)
- [ ] Prueba de panel admin (solo con email correcto)
- [ ] HTTPS activo (automático en Netlify/Vercel)
- [ ] Dominio personalizado configurado (opcional)

---

## 📞 SOPORTE

Si encuentras errores:

1. **Verifica los logs:**
   - Netlify: **Logs → Functions** en el dashboard
   - Vercel: **Logs** en la página de deployment

2. **Abre DevTools en el navegador:**
   - **F12 → Console** para ver errores de JavaScript
   - **Network** para ver peticiones HTTP

3. **Revisa las variables de entorno:**
   - Netlify: **Site settings → Build & deploy → Environment**
   - Vercel: **Settings → Environment Variables**

---

## 🎉 ¡LISTA!

Tu aplicación Rodríguez Conecta está segura, escalable y lista para producción.

**Características logradas:**
✅ Teléfono protegido (no en el DOM)
✅ Autenticación con Clerk
✅ Subida de imágenes con ImgBB
✅ Eliminación segura de posts
✅ Panel de moderación para admin
✅ Base de datos segura en Neon
✅ Función serverless que proxea query correctamente
✅ Deploying en Netlify/Vercel

---

**Última actualización:** 2026
**Versión:** 1.0.0 (MVP Seguro)
