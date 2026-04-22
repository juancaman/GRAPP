# 🚀 Guía Paso a Paso: Deploy a Netlify

## Tiempo total: ~15 minutos

---

## PASO 1: Preparar Proyecto Localmente (3 min)

### 1.1 Descargar/Clonar

```bash
# Si tienes git
git clone tu-repo-url
cd rodriguez-conecta

# Si no, descarga el ZIP y extrae
# Abre terminal en la carpeta
```

### 1.2 Crear `.env.local`

```bash
# Copiar template
cp .env.local.example .env.local

# Editar (puede ser en VS Code)
# codigo .env.local
```

**Contenido de `.env.local`:**

```env
# PASO A: De Neon
DATABASE_URL=postgresql://user:password@ep-xxxxx-xxxxx.neon.tech/neon

# PASO B: De Clerk
CLERK_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxxxxxx
CLERK_SECRET_KEY=sk_live_xxxxxxxxxxxxxxxx

# PASO C: De ImgBB
VITE_IMGBB_KEY=xxxxxxxxxxxxxxxxxxxxxxxx

# PASO D: Tu email (para ser admin)
VITE_ADMIN_EMAIL=tuemailadmin@gmail.com
```

### 1.3 Instalar Dependencias

```bash
npm install
npm install @neondatabase/serverless jose
```

### 1.4 Test Local

```bash
npm run dev
# Abre http://localhost:5173
# Verifica que cargue sin errores
```

---

## PASO 2: Crear BD en Neon (2 min)

### 2.1 Ir a Neon

1. Visita: https://neon.tech
2. "Sign Up" (o login si tienes cuenta)
3. Completa el formulario
4. Click "Create Account"

### 2.2 Crear Proyecto

1. Dashboard → "New Project" (botón verde)
2. Nombre: `rodriguez-conecta`
3. Region: Latinoamérica (si está disponible) o USA East
4. Click "Create Project"

### 2.3 Obtener Connection String

1. En el proyecto, click "Connection"
2. Copiar el string que empieza con `postgresql://`
3. **Pegar en `.env.local`** como `DATABASE_URL=`

### 2.4 Ejecutar SQL

1. En el proyecto Neon, ir a "SQL Editor"
2. Copiar TODO el contenido de `NEON_SCHEMA.sql`
3. Pegar en el editor
4. Click "Execute" (botón verde)
5. ✅ Debería decir "Executed successfully"

---

## PASO 3: Setup Clerk (2 min)

### 3.1 Crear App

1. Visita: https://clerk.com
2. "Sign Up"
3. Click "Create Application"
4. Nombre: `rodriguez-conecta`
5. Seleccionar: **Email/Password**
6. Click "Create"

### 3.2 Obtener Claves

**Paso A - Publishable Key:**
1. Settings (engranaje) → "API Keys"
2. Copiar: `Publishable Key`
3. Pegar en `.env.local` como `CLERK_PUBLISHABLE_KEY=`

**Paso B - Secret Key:**
1. Mismo lugar, copiar: `Secret Key`
2. Pegar en `.env.local` como `CLERK_SECRET_KEY=`

### 3.3 Agregar Dominio (para Deploy)

1. Settings → "Domains"
2. Click "+ Add domain"
3. Agregar: `tu-sitio.netlify.app` (después del deploy)
4. Por ahora, solo agregar `localhost:5173` para testing

---

## PASO 4: Obtener API Key ImgBB (1 min)

1. Visita: https://imgbb.com
2. Sign Up / Login
3. Settings (arriba a la derecha) → "API"
4. Copiar: API Key
5. Pegar en `.env.local` como `VITE_IMGBB_KEY=`

---

## PASO 5: Actualizar `index.html` (1 min)

En `index.html`, buscar línea:

```javascript
const ADMIN_EMAIL = 'admin@example.com';
```

Reemplazar con tu email:

```javascript
const ADMIN_EMAIL = 'tuemailadmin@gmail.com';
```

---

## PASO 6: Instalar Netlify CLI (1 min)

```bash
npm install -g netlify-cli
```

O si usas npm sin -g:

```bash
npx netlify-cli@latest login
```

---

## PASO 7: Login en Netlify (1 min)

```bash
netlify login
```

Se abrirá navegador:
1. Click "Authorize"
2. Te redirigirá a terminal
3. Si dice "✅ Logged in" → ¡listo!

---

## PASO 8: Deploy (3 min)

### 8.1 Link Proyecto

```bash
netlify link
```

Seleccionar:
- "Create & configure a new site"
- Site name: `rodriguez-conecta` (o algo único)
- Team: Personal

### 8.2 Deploy a Producción

```bash
netlify deploy --prod
```

**Esperado:**
```
✔ Deploying to main site URL...
✔ Unique Deploy URL: https://xxxxx--rodriguez-conecta.netlify.app
✔ Site URL: https://rodriguez-conecta.netlify.app
```

### 8.3 Copiar URL del Site

El "Site URL" es tu URL pública. Ejemplo:
```
https://rodriguez-conecta.netlify.app
```

---

## PASO 9: Agregar Variables de Entorno en Netlify (2 min)

1. Dashboard de Netlify → tu sitio
2. Settings (arriba) → "Build & Deploy" → "Environment"
3. Click "+ Add variable"

**Agregar estas 5 variables:**

| Name | Value |
|------|-------|
| `DATABASE_URL` | postgresql://user:password@... (de Neon) |
| `CLERK_SECRET_KEY` | sk_live_... (de Clerk) |
| `VITE_IMGBB_KEY` | xxx... (de ImgBB) |
| `VITE_ADMIN_EMAIL` | tuemailadmin@gmail.com |
| `VITE_API_URL` | https://tu-dominio.netlify.app/api/db |

✅ Guardar cada una

---

## PASO 10: Finalizar Clerk (1 min)

1. Volver a Clerk Dashboard
2. Settings → "Domains"
3. Click "+ Add domain"
4. Agregar tu URL: `rodriguez-conecta.netlify.app`
5. Click "Add domain"

---

## ✅ VERIFICACIÓN FINAL

Visita: `https://tu-sitio.netlify.app`

### Test 1: Acceso
```
- Debe cargar
- Debe mostrar modal Clerk
- Debe decir "Acceder a Rodríguez Conecta"
```

### Test 2: Clerk Login
```
- Click en email input
- Escribir: test@example.com
- Click "Continue"
- Crear contraseña
- Verificar email (si requiere)
- ✅ Debería loguearTE
```

### Test 3: Crear Post
```
- Categoría: Precios
- Mensaje: "Test aviso"
- Foto: Seleccionar una
- Publicar
- ✅ Debería aparecer en feed
```

### Test 4: WhatsApp Oculto
```
- En post con teléfono
- Click "Contactar"
- ✅ Debería abrir WhatsApp
- F12 (Inspector)
- BUSCAR en HTML: tu número
- ✅ NO debería estar (está en memoria)
```

### Test 5: Panel Admin
```
- Logout
- Login con email = VITE_ADMIN_EMAIL
- Debería aparecer botón "Panel Admin"
- Click
- Debería ver tabla con todos los posts
- Botones "Verificar", "Ocultar", "Eliminar"
```

---

## 🐛 Si Algo Falla

### Error: "DATABASE_URL is not defined"
**Solución**: Falta agregar en Netlify Settings → Environment Variables

### Error: "401 Unauthorized"
**Solución**: CLERK_SECRET_KEY es inválido o no está en env vars

### Error: "Foto no carga"
**Solución**: VITE_IMGBB_KEY es inválido

### Error: "Admin panel no aparece"
**Solución**: Tu email en Clerk ≠ VITE_ADMIN_EMAIL (deben ser iguales)

### Error: "Conexión rechazada a DB"
**Solución**: DATABASE_URL es incorrecta o Neon está down

---

## 🔄 Re-Deploy Después de Cambios

Cualquier cambio en el código:

```bash
# Hacer cambios en index.html o api/db.js
# Guardar archivos
# En terminal:

netlify deploy --prod
```

---

## 📱 Compartir con Otros

URL: `https://rodriguez-conecta.netlify.app`

**Instrucciones para usuarios:**
1. Visita el link
2. Click "Sign Up" (si no tienes cuenta)
3. Email + contraseña
4. ¡Empieza a publicar!

---

## 🎉 ¡LISTO!

Tu app social está en producción.

**Resumen:**
- ✅ Frontend en Netlify
- ✅ Backend serverless en Netlify Functions
- ✅ Base de datos en Neon
- ✅ Auth con Clerk
- ✅ Imágenes en ImgBB
- ✅ Teléfono protegido
- ✅ Admin panel seguro

---

## 📚 Próximas Acciones

1. **Invitar vecinos**: Comparte `https://tu-sitio.netlify.app`
2. **Monitoreo**: Netlify dashboard → Analytics
3. **Respaldo**: Neon → Backups automáticos
4. **Mejoras**: Lee `QUICK_START.md` → "Próximas funcionalidades"

---

## 📞 Soporte Rápido

**¿Netlify no carga?**
- Ir a: https://status.netlify.com
- ¿Está todo verde? Sí → problemas locales
- ¿Rojo? → esperar

**¿Clerk no funciona?**
- Clerk Status: https://status.clerk.com

**¿Neon offline?**
- Neon Status: https://status.neon.tech

---

**¡A conectar con tus vecinos! 🏘️**
