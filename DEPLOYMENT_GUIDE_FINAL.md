## 🚀 GUÍA DE DEPLOYMENT - Rodríguez Conecta (Versión Integrada)

Complete esta guía paso a paso para tener la app funcionando en producción.

---

## 📋 REQUISITOS PREVIOS

- Cuenta en **Clerk** (auth.clerk.com)
- Cuenta en **Neon** (console.neon.tech)
- Cuenta en **ImgBB** (imgbb.com)
- Cuenta en **Netlify** o **Vercel** (para serverless functions)
- Cuenta en **GitHub** (opcional pero recomendado)

---

## 1️⃣ SETUP CLERK (Autenticación)

### Crear aplicación Clerk
1. Ve a https://dashboard.clerk.com y crea una nueva app
2. Elige **Email** como método de autenticación
3. En **API Keys**, copia:
   - `PUBLISHABLE_KEY` (frontend)
   - `SECRET_KEY` (backend)

### En tu `index_final.html`
- Busca `const CLERK_PUBLISHABLE_KEY` 
- Reemplaza con tu PUBLISHABLE_KEY de Clerk

---

## 2️⃣ SETUP NEON (Database PostgreSQL)

### Crear proyecto Neon
1. Ve a https://console.neon.tech/app/projects
2. Crea un nuevo proyecto
3. Copia la **Connection String** (URL completa)

### Ejecutar schema SQL
1. Abre el **SQL Editor** en Neon console
2. Copia TODO el contenido de `setup_final.sql`
3. Pega y ejecuta (Ctrl+Enter)
4. Verifica que se creó la tabla `posts` sin errores

### Resultado esperado
```
CREATE TABLE (columnas: id, user_id, user_email, categoria, mensaje, etc.)
CREATE INDEX (4 índices)
CREATE TRIGGER (para updated_at)
INSERT (4 posts de ejemplo)
```

---

## 3️⃣ SETUP IMGBB (Almacenamiento de Imágenes)

### Obtener API Key
1. Ve a https://api.imgbb.com
2. Regístrate / Login
3. Copia tu **API KEY**

### En tu `index_final.html`
- Busca `const IMGBB_API_KEY`
- Reemplaza con tu API KEY de ImgBB

---

## 4️⃣ SETUP BACKEND (Netlify Functions o Vercel)

### Opción A: Netlify Functions

#### Paso 1: Estructura de carpetas
```
proyecto/
├── netlify/
│   └── functions/
│       └── db.js          ← contenido de api_db_final.js
├── index_final.html       ← tu frontend
└── netlify.toml
```

#### Paso 2: Crear `netlify.toml`
```toml
[build]
  command = "npm install && npm run build"
  functions = "netlify/functions"
  publish = "."

[env]
  DATABASE_URL = "tu-connection-string-de-neon"
  CLERK_SECRET_KEY = "tu-secret-key-de-clerk"
  VITE_ADMIN_EMAIL = "tu-email@example.com"
```

#### Paso 3: Conectar con Git
1. Push tu código a GitHub
2. En Netlify Dashboard → New site → Connect to Git
3. Selecciona tu repo
4. En **Build settings**:
   - Command: `npm install`
   - Publish directory: `.`
5. En **Environment**:
   - DATABASE_URL = tu Neon connection string
   - CLERK_SECRET_KEY = tu Clerk secret
   - VITE_ADMIN_EMAIL = tu email de admin

#### Paso 4: Deploy
- Netlify automáticamente deployará tu sitio
- Tu backend estará en `https://tudominio.netlify.app/.netlify/functions/db`

### Opción B: Vercel Functions

#### Paso 1: Estructura
```
proyecto/
├── api/
│   └── db.js              ← contenido de api_db_final.js
├── index_final.html       ← tu frontend
└── vercel.json
```

#### Paso 2: Crear `vercel.json`
```json
{
  "buildCommand": "npm install",
  "env": {
    "DATABASE_URL": "@database_url",
    "CLERK_SECRET_KEY": "@clerk_secret",
    "VITE_ADMIN_EMAIL": "@admin_email"
  }
}
```

#### Paso 3: Deploy
```bash
npm install -g vercel
vercel
```

#### Paso 4: Agregar env vars en Vercel Dashboard
- Project Settings → Environment Variables
- DATABASE_URL, CLERK_SECRET_KEY, VITE_ADMIN_EMAIL

---

## 5️⃣ CONFIGURAR FRONTEND

### En `index_final.html`, busca esta sección y actualiza:

```javascript
const CONFIG = {
    apiUrl: 'https://tudominio.netlify.app/.netlify/functions/db',  // o tu URL de Vercel
    adminEmail: 'tu-email@example.com',  // Tu email para acceso admin
    clerkPublishableKey: 'pk_live_XXXXX'  // Tu Clerk publishable key
};
```

### Test URLs de API
- Netlify: `https://tudominio.netlify.app/.netlify/functions/db`
- Vercel: `https://tudominio.vercel.app/api/db`

---

## 6️⃣ TESTING PRE-DEPLOYMENT

### Test 1: Autenticación Clerk
```
1. Abre http://localhost:8000 (o tu servidor local)
2. Haz clic en "Iniciar Sesión"
3. Regístrate con email/contraseña
4. Verifica que aparece tu email en la esquina superior
```

### Test 2: Crear Post
```
1. Logueado, haz clic en el botón FAB (círculo azul inferior)
2. Elige categoría (Precios, Seguridad, Servicios, Basural)
3. Ingresa mensaje, teléfono
4. Sube imagen (opcional)
5. Haz clic "Publicar"
6. Verifica que el post aparece en el feed
```

### Test 3: Votación
```
1. Haz clic en "Me Sirve" en un post
2. Verifica que el contador aumenta
3. Recarga la página
4. Verifica que persiste (está en memoria del navegador, no BD)
```

### Test 4: Eliminar Post
```
1. Haz clic en los tres puntos (⋮) en tu post
2. Haz clic "Eliminar"
3. Verifica que el post desaparece del feed
```

### Test 5: Panel Admin
```
1. Logueado con tu email admin, presiona CTRL+SHIFT+A
2. Abre DevTools Console y ejecuta: goToAdmin()
3. Deberías ver tabla de todos los posts
4. Prueba "Verificar", "Ocultar", "Eliminar"
```

---

## 🔐 SEGURIDAD - CHECKLIST PRE-PRODUCCIÓN

- [ ] DATABASE_URL nunca está en frontend (solo en backend .env)
- [ ] CLERK_SECRET_KEY solo en backend (no en frontend)
- [ ] VITE_ADMIN_EMAIL configurado correctamente
- [ ] IMGBB_API_KEY está en frontend (es OK, es pública)
- [ ] Teléfono se almacena en memoria `posts[i].telefono` no en DOM
- [ ] Solo propietario puede eliminar su post (validado en backend SQL)
- [ ] Solo admin puede verificar, ocultar, eliminar posts (checked by email)
- [ ] JWT se valida en cada request (verificarClerkToken)
- [ ] CORS está permitido en backend

---

## 📱 URLS IMPORTANTES

| Servicio | URL |
|----------|-----|
| **Clerk Dashboard** | https://dashboard.clerk.com |
| **Neon Console** | https://console.neon.tech/app/projects |
| **ImgBB API** | https://api.imgbb.com |
| **Netlify Dashboard** | https://app.netlify.com |
| **Vercel Dashboard** | https://vercel.com/dashboard |
| **Tu Sitio** | https://tudominio.netlify.app (o .vercel.app) |

---

## 🆘 TROUBLESHOOTING

### Error: "401 No autenticado"
- Verifica que Clerk está loadado correctamente
- Asegúrate de estar logueado
- Abre DevTools → Network → busca request fallida → chequea headers

### Error: "Database connection failed"
- Verifica DATABASE_URL en variables de entorno
- Prueba conexión en Neon Console SQL Editor
- Chequea que la tabla `posts` existe

### Error: "403 No tienes permisos de administrador"
- Verifica que VITE_ADMIN_EMAIL es correcto
- Asegúrate de estar logueado con ese email
- En backend, chequea que la verificación JWT retorna email correcto

### Error: "ImgBB API error"
- Verifica que IMGBB_API_KEY es válido
- Chequea que la imagen es < 5MB
- Intenta con JPG/PNG/GIF

### Las imágenes no cargan
- Verifica en DevTools Network que la URL de ImgBB es válida
- Confirma que ImgBB API respondió correctamente
- Si error, post se publica sin imagen (comportamiento esperado)

---

## 📝 VARIABLES DE ENTORNO REQUERIDAS

```bash
# Backend (.env en Netlify/Vercel)
DATABASE_URL=postgres://usuario:contraseña@ep-xyz.neon.tech/database
CLERK_SECRET_KEY=sk_live_XXXXX
VITE_ADMIN_EMAIL=tu-email@example.com

# Frontend (en index_final.html, hardcoded es OK para MVP)
CLERK_PUBLISHABLE_KEY=pk_live_XXXXX
IMGBB_API_KEY=abc123xyz
```

---

## 🎯 RESUMEN: 5 REQUISITOS IMPLEMENTADOS

✅ **1. Teléfono Oculto**: Almacenado en memoria JavaScript, nunca en DOM  
✅ **2. Clerk Autenticación**: Email/password con JWT verification  
✅ **3. ImgBB Upload**: Subida directa desde frontend, URL guardada en BD  
✅ **4. Eliminar Propios**: Validación de propiedad en backend SQL  
✅ **5. Panel Admin**: Vista de todos los posts, verificación, ocultar/eliminar  

---

## 📞 SOPORTE

Para problemas:
1. Revisa DevTools Console (F12) por errores
2. Revisa Network tab por requests fallidas  
3. Revisa logs en Netlify/Vercel dashboard
4. Verifica que todas las env vars están correctas

---

**Última actualización**: 2024  
**Stack**: Clerk + Neon + ImgBB + Netlify/Vercel  
**Región**: General Rodríguez, Argentina
