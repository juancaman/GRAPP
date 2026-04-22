# 🔒 RODRÍGUEZ CONECTA - SETUP COMPLETO (15 MIN)

## ✅ 5 REQUISITOS IMPLEMENTADOS

1. **Teléfono OCULTO** ✅
   - Almacenado en memoria JS, nunca en el DOM
   - Generado solo al hacer clic en "Contactar"
   - Link WhatsApp: `https://wa.me/NUMERO?text=...`

2. **Autenticación CLERK** ✅
   - Login/signup por email
   - JWT en Authorization header
   - Solo autenticados publican

3. **Foto ImgBB** ✅
   - Upload directo a API ImgBB
   - URL almacenada en base de datos
   - Miniatura en feed

4. **Eliminar PROPIOS** ✅
   - Validación `WHERE user_id = $2` en SQL
   - Botón solo para propietario
   - Admin puede eliminar cualquiera

5. **Panel ADMIN** ✅
   - Acceso si `user.email === ADMIN_EMAIL`
   - Ver todos los posts
   - Botones: Verificar, Ocultar, Eliminar

---

## 📋 REQUISITOS PREVIOS

- Node.js 16+ instalado
- npm o yarn
- Cuenta en: Neon, Clerk, ImgBB, Netlify/Vercel

---

## 🚀 PASO A PASO

### PASO 1: Crear proyecto en NEON (3 min)

```
1. Ir a https://neon.tech
2. Click "Sign up"
3. Crear cuenta con GitHub/email
4. Click "Create project"
5. Nombre: "rodriguez-conecta"
6. Database: "neon" (por defecto)
7. Region: "Virginia (US East)" (más cercana)
8. Click "Create"
9. Esperar a que se cree (30 seg)
```

**Obtener CONNECTION STRING:**
```
10. Click en el proyecto
11. Copiar la CONNECTION STRING (formato: postgresql://...)
12. Guardar en notas (es tu DATABASE_URL)
```

---

### PASO 2: Ejecutar SQL en NEON (2 min)

```
1. En el dashboard de Neon, ir a "SQL Editor"
2. Copiar TODO el contenido de: NEON_SCHEMA_SECURE.sql
3. Pegar en el SQL Editor
4. Click "Execute" (botón play)
5. Esperar a que complete (debe decir "5 queries executed")
6. ✅ Base de datos lista
```

---

### PASO 3: Configurar CLERK (4 min)

```
1. Ir a https://clerk.com
2. Click "Sign up"
3. Usar GitHub para más rápido
4. Crear cuenta
5. Click "Create Application"
6. Nombre: "rodriguez-conecta"
7. Seleccionar providers: Email/Password ✅
8. Otros: dejar como están
9. Click "Create Application"
```

**Obtener KEYS:**
```
10. En la izquierda, click "API Keys"
11. Copiar "Publishable Key" (empieza con pk_live_)
12. Copiar "Secret Key" (empieza con sk_live_)
13. Guardar ambas
14. En "OAuth", ir a "Redirect URLs"
15. Agregar:
    - http://localhost:5173 (para desarrollo local)
    - https://tudominio.com (para producción)
16. Click "Save"
```

---

### PASO 4: Obtener API KEY de IMGBB (2 min)

```
1. Ir a https://imgbb.com
2. Click "Sign up"
3. Registrarse
4. Ir a https://imgbb.com/account/settings/api
5. Copiar "API Key"
6. Guardar (es tu VITE_IMGBB_KEY)
```

---

### PASO 5: Configurar proyecto LOCAL (2 min)

```bash
# 1. Crear carpeta proyecto
mkdir rodriguez-conecta
cd rodriguez-conecta

# 2. Inicializar npm
npm init -y

# 3. Instalar dependencias
npm install @neondatabase/serverless jose

# 4. Crear archivo .env.local
# Contenido:
DATABASE_URL=postgresql://... (de NEON)
CLERK_PUBLISHABLE_KEY=pk_live_... (de CLERK)
CLERK_SECRET_KEY=sk_live_... (de CLERK)
VITE_IMGBB_KEY=... (de IMGBB)
VITE_ADMIN_EMAIL=tuEmail@dominio.com

# 5. Crear carpeta api
mkdir api

# 6. Copiar archivos
# - index_secure.html → index.html
# - api_db_secure.js → api/db.js

# 7. Instalar Netlify CLI
npm install -g netlify-cli
```

---

### PASO 6: PROBAR LOCALMENTE (3 min)

```bash
# 1. Iniciar servidor local
npm run dev
# O simplemente abrir index.html en navegador

# 2. En navegador: http://localhost:5173
# (O el puerto que muestre el servidor)

# 3. Hacer clic en el ícono Clerk
# Se abrirá modal de login

# 4. Crear cuenta de prueba

# 5. Probar cada feature:
# - Crear post
# - Subir foto
# - Contactar (teléfono oculto)
# - Eliminar propio
```

---

### PASO 7: DESPLEGAR EN NETLIFY (5 min)

```bash
# 1. Hacer login en Netlify
netlify login

# 2. Crear archivo netlify.toml en raíz:
```

**Contenido de `netlify.toml`:**
```toml
[build]
command = "echo 'Build complete'"
publish = "."
functions = "api"

[[redirects]]
from = "/api/*"
to = "/.netlify/functions/:splat"
status = 200

[[redirects]]
from = "/*"
to = "/index.html"
status = 200

[functions]
node_bundler = "esbuild"
```

```bash
# 3. Deploy
netlify deploy --prod

# 4. Seguir pasos:
#    - Crear nuevo site
#    - Publicar directorio: . (actual)

# 5. Copiar URL del sitio

# 6. Ir a Netlify dashboard → Settings → Build & deploy
#    → Environment → Edit variables

# 7. Agregar variables:
DATABASE_URL = (de NEON)
CLERK_PUBLISHABLE_KEY = (de CLERK)
CLERK_SECRET_KEY = (de CLERK)
VITE_IMGBB_KEY = (de IMGBB)
VITE_ADMIN_EMAIL = tuEmail@dominio.com

# 8. Redeploy
netlify deploy --prod

# 9. Actualizar Clerk redirect URLs:
#    Agregar: https://tuSitio.netlify.app
```

---

## 🛡️ SEGURIDAD

### Teléfono Oculto
```javascript
// ❌ NUNCA en el DOM
// ✅ Almacenado en memoria JS: allPosts[i].phone

// Solo se usa al clic:
window.open(`https://wa.me/${phone}...`)
```

### JWT Verification
```javascript
// Frontend obtiene token
const token = await Clerk.session?.getToken();

// Backend valida
const { payload } = await jwtVerify(jwt, secret);
```

### Ownership Validation
```sql
-- Backend verifica ownership
DELETE FROM posts
WHERE id = $1 AND user_id = $2;
-- Si no coincide user_id, no elimina
```

### Admin Whitelist
```javascript
// Solo si email === ADMIN_EMAIL
if (userEmail === ADMIN_EMAIL) {
    // Mostrar panel admin
}
```

---

## 🧪 TESTING CHECKLIST

```
FRONTEND
[ ] Página carga correctamente
[ ] Clerk modal aparece
[ ] Login/signup funciona
[ ] Crear post funciona
[ ] Foto sube correctamente
[ ] Feed muestra posts
[ ] Filtros funcionan
[ ] Botón "Contactar" abre WhatsApp
[ ] Teléfono NO visible en Inspector (F12)
[ ] Botón eliminar solo aparece en propios

BACKEND
[ ] Inspektor Network muestra POST a /api/db
[ ] Response tiene estructura correcta
[ ] Errores devuelven HTTP correcto (401, 403, 500)

DATABASE
[ ] Tabla posts existe
[ ] Índices creados
[ ] Datos de prueba presentes

ADMIN
[ ] Panel admin aparece si email correcto
[ ] Se ve tabla de todos los posts
[ ] Botones funcionan (Verificar, Ocultar, Eliminar)
```

---

## 🔧 TROUBLESHOOTING

### "Error: Database connection failed"
```
✓ Verificar DATABASE_URL en .env.local
✓ Verificar que Neon proyecto está activo
✓ Copiar CONNECTION STRING completa (incluir ?sslmode=require)
```

### "Error: Clerk is not defined"
```
✓ Esperar a que el script CDN cargue
✓ Verificar en DevTools: window.Clerk existe
✓ Recargar página
```

### "Error: IMGBB_KEY not found"
```
✓ Variable debe ser VITE_IMGBB_KEY (con VITE_ prefix)
✓ Reiniciar servidor local después de cambiar .env
✓ Recargar navegador (Ctrl+Shift+R fuerza reload)
```

### "Error: JWT verification failed"
```
✓ Verificar CLERK_SECRET_KEY en .env
✓ No debe ser PUBLISHABLE_KEY
✓ Debe empezar con sk_live_
```

### "Foto no sube"
```
✓ Verificar tamaño < 5MB
✓ Formato: JPG, PNG, GIF
✓ Abrir DevTools, ir a Network
✓ Ver si request a imgbb retorna 200 OK
✓ Si error 403: ImgBB key inválida
```

---

## 📱 ACCEDER A PANEL ADMIN

1. Asegúrate de que tu email en `.env` es el correcto
2. Login con ese email exacto en Clerk
3. Si eres admin, verás botón "🛡️ Admin" en header
4. Click en botón para ver tabla de moderación

---

## 🎯 PRÓXIMOS PASOS

1. ✅ Setup completado
2. Testear todas las funciones
3. Invitar 5 vecinos para probar
4. Recopilar feedback
5. Agregar features nuevas (búsqueda, notificaciones, etc.)

---

## 📞 SOPORTE

- **Error general**: Revisar logs en DevTools (F12)
- **Error en editor SQL**: Copiar error y buscar en Neon docs
- **Error deploy**: Ver logs en Netlify Dashboard
- **Error Clerk**: Ver docs en clerk.com/docs

---

## 🎉 CONCLUSIÓN

¡Ya tienes:
- ✅ Frontend seguro
- ✅ Backend autenticado
- ✅ DB en producción
- ✅ 5 requisitos cumplidos
- ✅ App lista para usuarios

**¡A conectar con tus vecinos!** 🏘️
