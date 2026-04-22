# ⚡ CHEAT SHEET - Deploy en 10 minutos

Versión resumida para desarrolladores con prisa.

---

## 📦 ARCHIVOS

```
index.html              ← Frontend (Vanilla JS + Clerk + ImgBB)
api_db.js              ← Función serverless (Node.js)
schema.sql             ← SQL para Neon (copy-paste)
package.json           ← Dependencias
netlify.toml           ← Config Netlify (o vercel.json para Vercel)
```

---

## ⚙️ SETUP (5 minutos)

### 1. Neon BD
```
1. https://console.neon.tech → Nuevo proyecto
2. Copia schema.sql → Pega en SQL editor → Ejecuta
3. Copia DATABASE_URL
```

### 2. Clerk Auth
```
1. https://clerk.com → Nueva app
2. Email/Password activado
3. Copia CLERK_PUBLISHABLE_KEY (frontend)
4. Copia CLERK_SECRET_KEY (backend)
```

### 3. ImgBB API
```
1. https://api.imgbb.com/ → Obtén tu API Key
2. Copia la key
```

---

## 🚀 DEPLOY (3 minutos)

### OPCIÓN A: NETLIFY (RECOMENDADO)

```
1. https://app.netlify.com → "Deploy manually"
2. Drag & Drop la carpeta production/
3. Settings → Build & Deploy → Environment Variables:
   - DATABASE_URL = tu_neon_url
   - CLERK_SECRET_KEY = sk_test_...
   - ADMIN_EMAIL = tu-email@ejemplo.com
   - IMGBB_API_KEY = tu_key_aqui
4. "Trigger deploy"
5. ✅ Done!
```

### OPCIÓN B: VERCEL

```
1. Git push a GitHub
2. https://vercel.com → Import repository
3. Add environment variables (4 variables como arriba)
4. Deploy
5. ✅ Done!
```

---

## 🛠️ POST-DEPLOY (2 minutos)

Edita `index.html` línea ~1110:

```javascript
const CONFIG = {
    API_BASE: 'https://tu-app.netlify.app',   // ← URL de tu deploy
    CLERK_PUBLISHABLE_KEY: 'pk_test_...',     // ← Tu clave Clerk
    ADMIN_EMAIL: 'tu-email@ejemplo.com',      // ← Tu email
    IMGBB_API_KEY: 'tu-key-aqui'              // ← Tu key ImgBB
};
```

Sube el HTML actualizado a Netlify/Vercel.

---

## ✅ TEST

```bash
# 1. Abre tu URL
https://tu-app.netlify.app/

# 2. Haz click "Ingresar"
# 3. Regístrate
# 4. Crea un aviso
# 5. Verifica:
#    - ¿Se ve la imagen?
#    - ¿El button "Contactar" abre WhatsApp?
#    - ¿Puedes eliminar TUS avisos?
```

---

## 🔐 SEGURIDAD (¿SE CUMPLE?)

- ✅ Teléfono NO en el HTML (solo en data-attribute)
- ✅ Solo usuarios autenticados pueden publicar
- ✅ Cada usuario solo elimina sus posts (validado en BD)
- ✅ Admin accesible si email == ADMIN_EMAIL
- ✅ Imágenes desde ImgBB
- ✅ BD en Neon (no expuesta)

---

## 🐛 ERRORES RÁPIDOS

| Error | Fix |
|-------|-----|
| Clerk no cargado | Check CLERK_PUBLISHABLE_KEY en index.html |
| "404 /api/posts" | Check que api_db.js está en Netlify/Vercel |
| "Conexión rechazada" | Check DATABASE_URL sin "/" final |
| No se suben imágenes | Check IMGBB_API_KEY en index.html |
| Admin sin panel | Check ADMIN_EMAIL exacto (case-sensitive) |

---

## 📡 ENDPOINTS

```
GET  /api/posts                    # Obtener posts
POST /api/posts                    # Crear (auth requerida)
DELETE /api/posts/:id              # Eliminar propio
PATCH /api/posts/:id/verify        # Verificar (admin)
PATCH /api/posts/:id/hide          # Ocultar (admin)
DELETE /api/posts/:id/admin        # Eliminar (admin)
```

---

## 🎯 VARIABLES DE ENTORNO

Configúralas en Netlify/Vercel > Environment:

```
DATABASE_URL=postgresql://user:pass@...
CLERK_SECRET_KEY=sk_test_...
ADMIN_EMAIL=tu-email@ejemplo.com
IMGBB_API_KEY=abcd1234...
```

---

## 📝 SQL (Copy-paste en Neon)

```sql
CREATE TABLE posts (
    id SERIAL PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    phone VARCHAR(20) NOT NULL,
    category VARCHAR(20) NOT NULL,
    author_id VARCHAR(255) NOT NULL,
    author_name VARCHAR(100),
    is_anonymous BOOLEAN DEFAULT false,
    is_verified BOOLEAN DEFAULT false,
    is_visible BOOLEAN DEFAULT true,
    image_url TEXT,
    votes INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_posts_author_id ON posts(author_id);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
```

---

## 🚨 RECUERDA

1. **DATABASE_URL** sin `/` final
2. **ADMIN_EMAIL** case-sensitive (minúsculas!)
3. **Telefono NUNCA en el HTML** (variable en JS)
4. **Netlify es más fácil que Vercel** (drag & drop)
5. **Clerk CDN se carga automático** (no olvides la clave)

---

## 📖 DOCUMENTACIÓN COMPLETA

- `SETUP_INSTRUCCIONES.md` - Guía paso a paso detallada
- `API_REFERENCE.md` - Todos los endpoints documentados
- `README.md` - Visión general del proyecto

---

**¿Listo? ¡Vamos! Deploy en 10 minutos. 🚀**
