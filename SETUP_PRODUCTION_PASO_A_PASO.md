# 🔧 GUÍA COMPLETA - Rodríguez Conecta Production

## 📋 ÍNDICE
1. [Crear DB en Neon](#crear-db-en-neon)
2. [Configurar Clerk](#configurar-clerk)
3. [Obtener API de ImgBB](#obtener-api-de-imgbb)
4. [Desplegar Backend (Netlify/Vercel)](#desplegar-backend)
5. [Desplegar Frontend](#desplegar-frontend)
6. [Reemplazar variables](#reemplazar-variables)
7. [Testing final](#testing-final)

---

## 1️⃣ CREAR DB EN NEON

### A. Signup en Neon

1. Ir a https://neon.tech
2. **Sign up** (gratis, sin tarjeta)
3. Confirmar email

### B. Crear proyecto

1. Click **"Create a project"**
2. **Name**: `rodriguez-conecta`
3. **Region**: `us-east-1` o la más cercana a Argentina
4. Click **"Create project"**
5. Esperar 30 segundos

### C. Copiar Connection String

1. En el dashboard, click **"Connection string"**
2. Copiar la URL completa: `postgresql://user:password@host/db`
3. Guardar en lugar seguro ⚠️

### D. Crear tabla

1. Click **"SQL Editor"** en el panel izquierdo
2. Crear **New Query**
3. Pegar TODO el contenido de `SQL_SCHEMA_NEON.sql`
4. Click **Run**
5. Debería decir "✅ Success"

---

## 2️⃣ CONFIGURAR CLERK

### A. Crear proyecto

1. Ir a https://dashboard.clerk.com
2. Click **"Create application"**
3. **Name**: `rodriguez-conecta`
4. Seleccionar:
   - ✅ Email/Password
   - ✅ OAuth (Google, GitHub - opcional)
5. Click **"Create application"**

### B. Obtener credenciales

1. En el dashboard, ir a **Credentials** (lado izquierdo)
2. Copiar:
   - **Publishable Key** → `CLERK_PUBLISHABLE_KEY`
   - **Secret Key** → `CLERK_SECRET_KEY`

### C. Habilitar Email/Password

1. Ir a **User & Authentication > Email, Phone, Username**
2. Verificar que **Email address** esté ON
3. **Password** esté ON (visible)

---

## 3️⃣ OBTENER API DE IMGBB

### A. Crear cuenta

1. Ir a https://imgbb.com
2. Click **"Sign up"**
3. Email + contraseña
4. Confirmar email

### B. Obtener API Key

1. Click en tu avatar (arriba a la derecha)
2. Click **"API"**
3. Copiar **API Key** completa
4. Guardar como `IMGBB_API_KEY`

---

## 4️⃣ DESPLEGAR BACKEND

Elegí una opción:

### OPCIÓN A: Netlify (MÁS FÁCIL)

#### Paso 1: Preparar carpeta

Crea esta estructura en tu PC:

```
rodriguez-conecta/
├── production-index.html
├── netlify/
│   └── functions/
│       └── db.js
└── netlify.toml
```

#### Paso 2: Crear `netlify.toml`

En la raíz, crea archivo `netlify.toml`:

```toml
[build]
  functions = "netlify/functions"

[functions]
  node_bundler = "esbuild"

[[redirects]]
  from = "/*"
  to = "/production-index.html"
  status = 200
```

#### Paso 3: Copiar `api/db.js`

1. Copia el contenido de `api-db.js` (que creamos antes)
2. Pégalo en `netlify/functions/db.js`

#### Paso 4: Subir a GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/tuuser/rodriguez-conecta.git
git push -u origin main
```

#### Paso 5: Desplegar en Netlify

1. Ir a https://netlify.com
2. Click **"Add new site"** → **"Import an existing project"**
3. Conectar tu repo de GitHub
4. **Deploy settings**:
   - Build command: (dejar vacío)
   - Publish directory: `.` (o raíz)
5. Click **"Deploy site"**

#### Paso 6: Agregar variables de entorno

1. En el site de Netlify, ir a **"Site settings"** → **"Build & deploy"** → **"Environment"**
2. Click **"Edit variables"**
3. Agregar:
   ```
   DATABASE_URL = postgresql://...
   CLERK_SECRET_KEY = sk_test_...
   ADMIN_EMAIL = tu@email.com
   ```
4. Redeploy (click **"Trigger deploy"**)

---

### OPCIÓN B: Vercel (ALTERNATIVA)

#### Paso 1: Estructura

```
rodriguez-conecta/
├── production-index.html
├── api/
│   └── db.js
└── vercel.json
```

#### Paso 2: Crear `vercel.json`

```json
{
  "version": 2,
  "builds": [
    {
      "src": "api/db.js",
      "use": "@now/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/$1"
    }
  ]
}
```

#### Paso 3: Subir a GitHub (igual que Netlify)

#### Paso 4: Desplegar

1. Ir a https://vercel.com
2. Click **"New Project"** → Connectar repo
3. **Environment Variables**:
   ```
   DATABASE_URL
   CLERK_SECRET_KEY
   ADMIN_EMAIL
   ```
4. Click **"Deploy"**

---

## 5️⃣ DESPLEGAR FRONTEND

### Opción A: Mismo sitio (MÁS SIMPLE)

Si desplegaste el backend en Netlify:

1. Renombra `production-index.html` → `index.html`
2. Sube junto al código a GitHub
3. Netlify lo sirve automáticamente

### Opción B: Sitio separado (Mejor práctica)

1. Crea carpeta nueva: `rodriguez-conecta-frontend`
2. Dentro, solo `index.html`
3. Sube a GitHub
4. Desplega en Netlify/Vercel como sitio separado

---

## 6️⃣ REEMPLAZAR VARIABLES

### En `production-index.html`

Busca la sección `// CONFIG` (línea ~300):

```javascript
const CLERK_PUBLISHABLE_KEY = 'YOUR_CLERK_PUBLISHABLE_KEY';
const API_URL = 'YOUR_API_URL';
const IMGBB_API_KEY = 'YOUR_IMGBB_API_KEY';
const ADMIN_EMAIL = 'admin@ejemplo.com';
```

**REEMPLAZA**:

| Variable | Dónde obtener |
|----------|---------------|
| `YOUR_CLERK_PUBLISHABLE_KEY` | Clerk Dashboard → Credentials → Publishable Key |
| `YOUR_API_URL` | URL de tu función serverless (ej: `https://tu-site.netlify.app/.netlify/functions/db`) |
| `YOUR_IMGBB_API_KEY` | ImgBB → API → API Key |
| `admin@ejemplo.com` | Tu email para acceso a admin panel |

---

## 🔗 CÓMO OBTENER LA URL DE LA FUNCIÓN

### En Netlify:
- Tu Site URL: `https://rodriguez-conecta-xxx.netlify.app`
- Función URL: `https://rodriguez-conecta-xxx.netlify.app/.netlify/functions/db`

### En Vercel:
- Tu Site URL: `https://rodriguez-conecta.vercel.app`
- Función URL: `https://rodriguez-conecta.vercel.app/api/db`

---

## 7️⃣ TESTING FINAL

### 1. Signup

1. Abre tu sitio
2. Click "Entrar"
3. Crear cuenta con email
4. Debería entrar

### 2. Crear aviso

1. Click ✏️
2. Llena formulario:
   - Categoría: Precios
   - Mensaje: "Test del MVP"
   - Teléfono: `+54 9 11 1234567890`
   - Foto: (opcional)
3. Click "Publicar"

### 3. Ver en feed

- El aviso debería aparecer
- El teléfono NO debería ser visible (solo data attribute)
- Click "📲 Contactar" → Abre WhatsApp

### 4. Eliminar aviso

- Solo TÚ ves botón "Eliminar" en tu aviso
- Click eliminar → Desaparece

### 5. Admin (si tu email = ADMIN_EMAIL)

1. Login con tu email
2. Click "👨‍⚖️ Admin"
3. Debería ver todos los avisos
4. Probar verificar, ocultar, eliminar

---

## ❌ TROUBLESHOOTING

| Problema | Solución |
|----------|----------|
| "No puedo crear cuenta" | Verifica Email/Password habilitado en Clerk |
| "Error al publicar" | Verifica API_URL correcta en código |
| "Imagen no sube" | Verifica IMGBB_API_KEY valida |
| "Admin no aparece" | Tu email debe ser EXACTAMENTE igual a ADMIN_EMAIL |
| "Función no existe" | Redeploy en Netlify/Vercel |
| "CORS error" | Verifica headers en api-db.js |

---

## 📱 VERIFICAR PHONE OCULTO

Para comprobar que el teléfono se protege:

1. Abre DevTools (F12)
2. Inspecciona elemento del botón "Contactar"
3. Debería ver: `<button ... data-phone="5491112345678">`
4. ❌ NUNCA debería ver el teléfono en el HTML visible
5. Solo el `data-phone` (legible para JS)

---

## 🔐 CHECKLIST DE SEGURIDAD

- [ ] DATABASE_URL no está en el frontend ✅
- [ ] CLERK_SECRET_KEY solo en backend ✅
- [ ] Teléfono hasheado en BD ✅
- [ ] Teléfono solo en atributo `data-` en frontend ✅
- [ ] Solo dueño puede eliminar su aviso ✅
- [ ] Admin verificado por email ✅
- [ ] HTTPS activo (Netlify/Vercel) ✅
- [ ] CORS limitado (o * para MVP) ✅

---

## 🚀 ¡LISTO!

Tu MVP está en producción:
- ✅ BD remota (Neon)
- ✅ Auth real (Clerk)
- ✅ Backend seguro (serverless)
- ✅ Frontend responsive (glassmorphism)
- ✅ Teléfono protegido

**Próximos pasos**:
1. Compartir link con vecinos
2. Monitorear en Neon dashboard
3. Revisar Netlify/Vercel logs si hay errores
4. Escalar cuando sea necesario

---

**¿Preguntas?** Revisá `ARCHITECTURE_PRODUCTION.md`

¡Éxito! 🎉
