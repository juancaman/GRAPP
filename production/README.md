# 🏘️ Rodríguez Conecta - Arquitectura Segura

**Tablero vecinal para General Rodríguez con autenticación moderna, BD segura y funciones serverless.**

---

## 📁 ESTRUCTURA DE ARCHIVOS

```
production/
├── 📄 index.html                    Frontend completo (Vanilla JS + Clerk + ImgBB)
├── 📄 api_db.js                    Función serverless (Node.js, proxea a Neon)
├── 📄 schema.sql                   SQL schema para Neon (copiar y pegar)
├── 📄 package.json                 Dependencias para Netlify/Vercel
├── 📄 netlify.toml                 Config de Netlify
├── 📄 vercel.json                  Config de Vercel
├── 📄 SETUP_INSTRUCCIONES.md       Guía paso a paso (⭐ LEER PRIMERO)
└── 📄 README.md                    Este archivo
```

---

## ⚡ INICIO RÁPIDO

### 1️⃣ Leer la guía
Abre **`SETUP_INSTRUCCIONES.md`** y sigue los 7 pasos.

### 2️⃣ Crear BD en Neon
- Ve a https://console.neon.tech
- Copia el SQL de **`schema.sql`** y pégalo en el editor SQL
- Copia tu `DATABASE_URL`

### 3️⃣ Configurar Clerk
- Ve a https://clerk.com
- Habilita Email/Password
- Copia tu `CLERK_PUBLISHABLE_KEY` y `CLERK_SECRET_KEY`

### 4️⃣ ImgBB API
- Ve a https://api.imgbb.com/
- Copia tu API Key

### 5️⃣ Desplegar
- **Opción A (Recomendado):** Netlify - Drag & Drop
- **Opción B:** Vercel - Git push

### 6️⃣ Reemplazar variables
Edita `index.html` línea ~1110:
```javascript
const CONFIG = {
    API_BASE: 'https://tu-app.netlify.app',
    CLERK_PUBLISHABLE_KEY: 'pk_test_...',
    ADMIN_EMAIL: 'tu-email@ejemplo.com',
    IMGBB_API_KEY: 'tu-key-aqui'
};
```

---

## 🔒 CARACTERÍSTICAS DE SEGURIDAD

| Requisito | Solución | Status |
|-----------|----------|--------|
| 📱 Teléfono no en DOM | Data-attribute + JS dinámico | ✅ |
| 🔐 Auth requerida | Clerk Email/Password | ✅ |
| 🖼️ Subir imágenes | ImgBB API | ✅ |
| 🗑️ Eliminar propios posts | Validación user_id en backend | ✅ |
| 🛡️ Panel Admin | Verificación de email en servidor | ✅ |

---

## 🛠️ CÓMO DESPLEGAR

### Opción A: NETLIFY (Más fácil)

1. Descarga este folder `production/`
2. Ve a https://app.netlify.com
3. Haz **Drag & Drop** de la carpeta en "Deploy manually"
4. En **Site settings → Environment**, agrega:
   - `DATABASE_URL`
   - `CLERK_SECRET_KEY`
   - `ADMIN_EMAIL`
   - `IMGBB_API_KEY`
5. **Trigger deploy** en la sección Deploys
6. ¡Listo! Accede a tu URL en ~2 minutos

### Opción B: VERCEL

1. Sube a GitHub
2. Ve a https://vercel.com
3. Importa tu repositorio
4. Agrega las 4 variables de entorno
5. ¡Deploy automático!

---

## 📡 API ENDPOINTS

```bash
# GET - Obtener todos los posts
GET /api/posts

# POST - Crear nuevo post (requiere auth)
POST /api/posts
Body: { title, description, phone, category, is_anonymous, image_url }

# DELETE - Eliminar post (solo propietario)
DELETE /api/posts/:id

# PATCH - Verificar post (solo admin)
PATCH /api/posts/:id/verify
Body: { is_verified: true/false }

# PATCH - Ocultar/mostrar post (solo admin)
PATCH /api/posts/:id/hide
Body: { is_visible: true/false }

# DELETE - Eliminar como admin
DELETE /api/posts/:id/admin
```

---

## 🔑 VARIABLES DE ENTORNO

Configúralas en **Netlify/Vercel Settings → Environment Variables**:

```env
DATABASE_URL=postgresql://user:pass@host/db
CLERK_SECRET_KEY=sk_test_...
ADMIN_EMAIL=admin@ejemplo.com
IMGBB_API_KEY=tu-key-aqui
```

---

## 🐛 DEBUGGING

### "Clerk no cargado"
→ Verifica `CLERK_PUBLISHABLE_KEY` en `index.html`

### "Error 404 en /api/posts"
→ Revisa los logs en Netlify Functions / Vercel Logs

### "Conexión a BD rechazada"
→ Valida `DATABASE_URL` en panel de variables de entorno

### "Las imágenes no se suben"
→ Verifica `IMGBB_API_KEY` en `index.html`

---

## 📊 SQL SCHEMA

**Tabla `posts`:**
- `id` (SERIAL, PRIMARY KEY)
- `title` (VARCHAR 100)
- `description` (TEXT)
- `phone` (VARCHAR 20) - ⚠️ NUNCA mostrado en frontend
- `category` (VARCHAR: precios, seguridad, servicios, basural)
- `author_id` (VARCHAR, FK con Clerk)
- `author_name` (VARCHAR)
- `is_anonymous` (BOOLEAN)
- `is_verified` (BOOLEAN) - ✓ verificado por admin
- `is_visible` (BOOLEAN) - oculto por moderación
- `image_url` (TEXT) - enlace ImgBB
- `votes` (INT)
- `created_at`, `updated_at` (TIMESTAMP)

---

## 🎨 FRONTEND

**Tecnologías:**
- Vanilla JS (sin frameworks)
- Clerk CDN (autenticación)
- ImgBB API (imágenes)
- Glassmorphism CSS

**Secciones del código:**
1. `// CONFIG` - Variables globales
2. `// AUTH (CLERK)` - Gestión de sesión
3. `// IMG UPLOAD (IMGBB)` - Subida de imágenes
4. `// FEED` - Renderizado de posts
5. `// CRUD` - Crear, leer, actualizar, eliminar
6. `// ADMIN` - Panel de moderación

---

## ⚙️ BACKEND (SERVERLESS)

**Tecnología:** Node.js + PostgreSQL (Neon)

**Responsabilidades:**
- ✅ Validar JWT de Clerk
- ✅ Ejecutar queries en Neon
- ✅ Verificar permisos (propietario vs admin)
- ✅ ⚠️ NUNCA devolver teléfono en respuesta API (salvo al propietario)

---

## 🚀 PRODUCCIÓN

Antes de ir a producción, verifica:

- [ ] HTTPS activo
- [ ] CORS configurado
- [ ] Logs monitoreados
- [ ] Backups de BD automáticos
- [ ] Email admin configurado correctamente
- [ ] Dominio personalizado (opcional)
- [ ] Rate limiting (opcional, en Netlify/Vercel)

---

## 📞 SOPORTE

**Errores más comunes:**

| Error | Solución |
|-------|----------|
| "Clerk no cargado" | Reemplaza `CLERK_PUBLISHABLE_KEY` correctamente |
| "404 /api/posts" | Verifica que `api/db.js` está en Netlify/Vercel |
| "Conexión rechazada" | Valida `DATABASE_URL` sin `/` final |
| "No puedo crear posts" | ¿Estás logueado? Se requiere autenticación |
| "Admin no ve panel" | Verifica `ADMIN_EMAIL` exacto en variables de entorno |

---

## 📝 TODO POW-UPS FUTUROS

- [ ] Rate limiting por usuario
- [ ] Comentarios en posts
- [ ] Notificaciones por email
- [ ] Categorías dinámicas
- [ ] Búsqueda full-text
- [ ] Geolocalización precisa
- [ ] Reputación de usuarios
- [ ] Reporte de posts

---

## 📄 LICENCIA

MIT

---

## 🎉 ¡LISTO!

Tu tablero vecinal está seguro, escalable y listo para conectar a los vecinos de General Rodríguez.

**Próximo paso:** Lee `SETUP_INSTRUCCIONES.md` 👈
