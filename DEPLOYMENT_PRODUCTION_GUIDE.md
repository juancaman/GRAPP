# 🚀 RODRÍGUEZ CONECTA - VERSIÓN PRODUCTION READY

**3 Archivos Listos para Deployment. Copy-Paste y Deploy.**

---

## 📦 ARCHIVOS ENTREGADOS

### 1️⃣ **`index.html`** (Frontend Completo)
- ✅ CSS glassmorphism integrado
- ✅ Clerk Auth (Email/Password)
- ✅ ImgBB upload de imágenes
- ✅ Teléfono protegido (memoria + endpoint admin)
- ✅ Estadísticas en tiempo real (📊 Esta semana + 📈 Total)
- ✅ Panel Admin (CTRL+SHIFT+A o ?admin=true)
- ✅ Eliminar posts (solo propietario)
- ✅ Vanilla JS puro, sin frameworks

**Ubicación**: Copiar a raíz del proyecto o a `public/index.html` en Netlify/Vercel

### 2️⃣ **`api/index.js`** (Backend Serverless)
- ✅ Compatible Netlify Functions y Vercel
- ✅ Endpoints GET/POST/DELETE/PATCH
- ✅ Neon PostgreSQL (@neondatabase/serverless)
- ✅ JWT Clerk verification
- ✅ Admin-only operations
- ✅ Nunca expone secrets

**Ubicación**: 
- Netlify: `netlify/functions/index.js`
- Vercel: `api/index.js`

### 3️⃣ **`setup.sql`** (Database Schema)
- ✅ Tabla `posts` con 11 columnas
- ✅ Índices para performance
- ✅ Trigger automático para `updated_at`
- ✅ Comentarios de seguridad
- ✅ Queries de referencia

**Ubicación**: Ejecutar en Neon SQL Editor

---

## 🔑 CONFIGURACIÓN REQUERIDA

### Paso 1: Crear Aplicación en Clerk
1. Ve a https://dashboard.clerk.com
2. Crea nueva app → Email/Password auth
3. Copia `PUBLISHABLE_KEY` (frontend)
4. Copia `SECRET_KEY` (backend)

**En `index.html` línea ~700**:
```javascript
CONFIG.CLERK_PUBLISHABLE_KEY = 'pk_live_YOUR_KEY_HERE';
```

### Paso 2: Obtener API Key ImgBB
1. Ve a https://api.imgbb.com
2. Regístrate y obtén tu API KEY
3. Max 5MB por imagen

**En `index.html` línea ~705**:
```javascript
CONFIG.IMGBB_API_KEY = 'YOUR_IMGBB_KEY_HERE';
```

### Paso 3: Crear Base de Datos en Neon
1. Ve a https://console.neon.tech
2. Crea nuevo proyecto PostgreSQL
3. Copia **Connection String**
4. Ejecuta `setup.sql` completo en SQL Editor

### Paso 4: Variables de Entorno Backend

**Netlify (`netlify.toml`)**:
```toml
[env]
DATABASE_URL = "postgres://..."  # De Neon
CLERK_SECRET_KEY = "sk_live_..."  # De Clerk
VITE_ADMIN_EMAIL = "tu-email@example.com"
```

**Vercel (Project Settings → Environment Variables)**:
- DATABASE_URL
- CLERK_SECRET_KEY
- VITE_ADMIN_EMAIL

### Paso 5: URL del Backend

**En `index.html` línea ~710**:
```javascript
CONFIG.API_URL = 'http://localhost:3000/api';  // Local development
// O
CONFIG.API_URL = 'https://tuapp.netlify.app/.netlify/functions/index';  // Netlify
// O
CONFIG.API_URL = 'https://tuapp.vercel.app/api/index';  // Vercel
```

**En `index.html` línea ~712**:
```javascript
CONFIG.ADMIN_EMAIL = 'tu-email@example.com';  // Tu email de admin
```

---

## 🔗 ENDPOINTS API

```
GET  /api?get=posts          → Posts públicos visibles (50 últimos)
GET  /api?get=stats          → Estadísticas (weekly + total count)
GET  /api?get=all_posts      → Todos los posts (admin only + Bearer token)

POST /api                    → Crear post (requiere Bearer token)
     Body: { category, message, phone, image_url }

DELETE /api?id=POST_ID       → Eliminar post (solo owner o admin + token)

PATCH /api                   → Admin actions (toggle visibility, etc)
      Body: { post_id, action, value }
```

---

## 📋 PASOS DE DEPLOYMENT

### Opción A: Netlify

#### 1. Estructura carpetas
```
proyecto/
├── index.html          ← Frontend
├── netlify.toml        ← Config
├── netlify/
│   └── functions/
│       └── index.js    ← Backend (contenido api_index.js)
└── package.json        ← Dependencies
```

#### 2. `package.json`
```json
{
  "name": "rodriguez-conecta",
  "version": "1.0.0",
  "dependencies": {
    "@neondatabase/serverless": "^0.9.0"
  }
}
```

#### 3. `netlify.toml`
```toml
[build]
  command = "npm install"
  functions = "netlify/functions"
  publish = "."

[env]
  DATABASE_URL = "postgres://user:pass@host/db"
  CLERK_SECRET_KEY = "sk_live_..."
  VITE_ADMIN_EMAIL = "admin@example.com"
```

#### 4. Deploy
```bash
npm install -g netlify-cli
netlify login
netlify deploy --prod
```

### Opción B: Vercel

#### 1. Estructura
```
proyecto/
├── index.html      ← Servida como raíz
├── vercel.json     ← Config
├── api/
│   └── index.js    ← Backend
└── package.json
```

#### 2. `vercel.json`
```json
{
  "buildCommand": "npm install",
  "env": {
    "DATABASE_URL": "@database_url",
    "CLERK_SECRET_KEY": "@clerk_secret_key",
    "VITE_ADMIN_EMAIL": "@admin_email"
  }
}
```

#### 3. Deploy
```bash
npm install -g vercel
vercel
```

---

## 🧪 TESTING PRE-DEPLOYMENT

### Test 1: Autenticación Clerk
```
1. Abre http://localhost:3000 (o tu URL)
2. Haz clic en el box de login
3. Regístrate con email/contraseña
4. Debes ver tu email en header
```

### Test 2: Crear Post
```
1. Haz clic en FAB (círculo azul ✏️)
2. Selecciona categoría, escribe mensaje, teléfono
3. Sube imagen opcional
4. Haz clic "📤 Publicar"
5. Debes verlo en el feed
```

### Test 3: Estadísticas
```
1. Verifica que aparece "📊 Esta semana: X" en la barra
2. Espera 30 segundos
3. Crea otro post
4. El contador debe incrementar
```

### Test 4: Panel Admin
```
1. Logueado como admin@example.com
2. Presiona CTRL+SHIFT+A
3. Debes ver tabla con todos los posts
4. Prueba "Ocultar" y "Eliminar"
```

### Test 5: Teléfono Protegido
```
1. Abre DevTools (F12)
2. Busca en Network → GET /api?get=all_posts
3. Response debe incluir campo "phone": "+54..."
4. En HTML visible del post NO debe haber teléfono
```

---

## 🔒 CHECKLIST DE SEGURIDAD PRE-PRODUCCIÓN

- [ ] `DATABASE_URL` NO está en `index.html` (solo en backend env vars)
- [ ] `CLERK_SECRET_KEY` NO está en frontend
- [ ] `CLERK_PUBLISHABLE_KEY` está en `index.html` (es público)
- [ ] `IMGBB_API_KEY` está en `index.html` (es público)
- [ ] Admin email está configurado correctamente
- [ ] Teléfono NO aparece en el DOM visible (inspecciona con DevTools)
- [ ] JWT verification en backend (`api_index.js` línea ~30-50)
- [ ] Ownership validation en DELETE (WHERE user_id = $2)
- [ ] CORS headers correctos en backend
- [ ] setup.sql ejecutado exitosamente en Neon

---

## 🆘 TROUBLESHOOTING

| Problema | Causa | Solución |
|----------|-------|----------|
| "Not authenticated" | JWT inválido | Verificar que Clerk está correctamente cargado |
| 403 Forbidden | No admin | Usar correcto VITE_ADMIN_EMAIL |
| Database connection failed | CONNECTION_URL | Copiar completo de Neon + incluir password |
| Imagen no sube | ImgBB API key inválido | Verificar key y que imagen < 5MB |
| Stats no actualizan | API_URL incorreta | Revisar URL del backend en index.html |
| CORS error | Missing headers | Backend debe tener `Access-Control-Allow-*` |

---

## 📚 ARCHIVOS ADICIONALES GENERADOS

- `api_db_final.js` → Versión anterior (IGNORAR, usar `api_index.js`)
- `index_final.html` → Versión anterior (IGNORAR, usar `index.html`)
- Documentación varias → Para referencia (IGNORAR)

**Solo usar**:
- ✅ `index.html` (Frontend)
- ✅ `api_index.js` (Backend)
- ✅ `setup.sql` (Database)

---

## 💡 TIPS DE DESARROLLO

### Local Development
```bash
# Terminal 1: Servidor frontend (Python)
python -m http.server 3000

# Terminal 2: Backend serverless (local)
npm install -g netlify-cli
netlify dev  # O: netlify functions:invoke index

# En index.html, cambiar:
CONFIG.API_URL = 'http://localhost:8888/.netlify/functions/index';
```

### Agregar nuevas categorías
1. Editar `index.html` línea ~698 (CONFIG.categorias)
2. Editar HTML del modal (opción en select)
3. Agregar color en CSS (--cat-nueva)

### Cambiar colores
Editar `index.html` línea ~19-33 (CSS variables)

### Aumentar límite de posts
`api_index.js` línea ~69: cambiar `LIMIT 50`

---

## 📞 SOPORTE RÁPIDO

**Clerk Issues**: https://clerk.com/docs
**Neon Issues**: https://neon.tech/docs
**ImgBB Issues**: https://imgbb.com/api

---

**Status**: ✅ Production Ready
**Last Update**: 2024
**Tech Stack**: Vanilla JS + Clerk + ImgBB + Neon + Netlify/Vercel
**License**: MIT
