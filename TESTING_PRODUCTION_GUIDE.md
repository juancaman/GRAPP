# 🧪 GUÍA DE TESTING - Rodríguez Conecta

Sigue estos pasos para verificar que tu app funciona correctamente en cada etapa.

---

## ✅ PHASE 1: Setup Inicial

### ✓ Verificar Neon
```bash
# 1. En la consola de Neon, ejecuta:
SELECT COUNT(*) FROM posts;
# Debería devolver: 1 (del seed data)

# 2. Verifica la tabla existe:
\dt posts
# Debería mostrar la tabla con columnas

# 3. Verifica los índices:
\di
# Debería mostrar 5 índices
```

### ✓ Verificar Clerk
1. Abre https://dashboard.clerk.com
2. Ve a "Users"
3. Crea un usuario de test: `test@ejemplo.com` / `password123`
4. Nota el ID (ej: `user_2aB3cD4eF5...`)
5. Este será tu test user

### ✓ Verificar ImgBB
```bash
# En DevTools, consola del navegador:
const API_KEY = 'tu_apibb_key';
console.log('ImgBB Key:', API_KEY);
# Debería mostrar tu clave completa
```

---

## ✅ PHASE 2: Despliegue Backend

### ✓ Verificar Función Netlify/Vercel

#### Netlify
```bash
# En la CLI:
netlify functions:list
# Debería mostrar: db

netlify functions:logs db
# Debería conectarse sin errores
```

#### Vercel
```bash
# En Dashboard de Vercel
# Ve a Deployments
# Verifica "Deployment is ready"
```

### ✓ Probar endpoint manualmente

```bash
# En terminal:
curl -X GET "https://tu-app.netlify.app/.netlify/functions/db?action=getPosts"

# Debería devolver:
# {
#   "statusCode": 200,
#   "body": "[{...posts...}]"
# }
```

---

## ✅ PHASE 3: Frontend Local

### ✓ Verificar variables de config
Abre DevTools (F12) → Console:

```javascript
// Busca estas líneas en production-index.html (aprox línea 300)
const CONFIG = {
    CLERK_PUBLISHABLE_KEY: 'pk_live_...',
    API_URL: 'https://tu-app.netlify.app/.netlify/functions/db',
    IMGBB_API_KEY: 'tu_imgbb_key',
    ADMIN_EMAIL: 'tu_email@gmail.com'
};

// Copia cada valor en la consola
console.log(CONFIG.CLERK_PUBLISHABLE_KEY);
# Si muestra 'undefined', las variables no fueron reemplazadas ⚠️
```

### ✓ Verificar Clerk carga
```javascript
// En consola:
console.log(window.Clerk);
# Debería mostrar objeto con métodos

// O busca en HTML source (Ctrl+U):
# <script src="https://cdn.clerk.com/clerk.js"></script>
# Debería estar ahí
```

---

## ✅ PHASE 4: Flujo de Auth

### Test 1: Signup
1. Abre app (http://localhost:5173 o tu URL)
2. Haz click en botón FAB azul (+ Create)
3. Te debe redirigir a Clerk signup
4. *Completa form:
   - Email: `test@example.com`
   - Password: `TestPass123!`
5. Verifica email (si lo pide)
6. Debería regresar a app y mostrar tu email en header

**Verificación en DevTools**:
```javascript
// Console:
console.log(window.Clerk.user);
# Debería mostrar { id: '...', email: 'test@example.com' }
```

### Test 2: Login
1. Logout (click en 👤 avatar → Sign Out)
2. Vuelve a hacer click en botón + Create
3. Selecciona "Sign In" en lugar de Sign Up
4. Usa: `test@example.com` / `TestPass123!`
5. Debería regresar autenticado

---

## ✅ PHASE 5: Crear Aviso

### Test 1: Crear post simple (sin imagen)

1. Click en botón + (FAB azul)
2. Selecciona categoría: **"Precios"**
3. Completa form:
   - Mensaje: `Test - Leche $150 el litro`
   - Teléfono: `5491112345678`
   - *(opcional) Anónimo: déjalo desmarcado
   - *(opcional) Imagen: skip por ahora

4. Click "Publicar"

**Verificaciones**:

✓ En **Feed**: Debería aparecer el post arriba con:
   - Badge "🛒 Precios"
   - Tu mensaje
   - Botón "📲 Contactar"
   - 0 votos
   - Hora de creación
   - Botón "❌ Eliminar" (solo si eres dueño)

✓ En **DevTools → Console**:
```javascript
// Busca tu post en el DOM
document.querySelector('[data-post-id]')
# Debería mostrar elemento HTML

// Verifica que el teléfono NO está visible
document.body.innerText.includes('5491112345678')
# Debería mostrar: false ✅
```

✓ En **Neon Portal**:
```sql
SELECT * FROM posts ORDER BY created_at DESC LIMIT 1;
```
Debería mostrar tu post con:
- `phone_hash`: sha256(5491112345678) - un hash largo, no el número

### Test 2: Crear post con imagen

1. Click en + FAB
2. Selecciona "Seguridad"
3. Completa:
   - Mensaje: `Atención - Dron en barrio Noroeste`
   - Teléfono: `5491198765432`
   - Imagen: Selecciona cualquier JPG/PNG < 5MB

4. Debería mostrar preview locally

5. Click "Publicar"

**Verificaciones**:

✓ Se debe subir a ImgBB (espera 2-3 segundos)
✓ En el feed: Debe aparecer la imagen debajo del texto
✓ La imagen debe ser el URL de ImgBB: `https://i.ibb.co/...`

✓ En **Neon**:
```sql
SELECT id, mensaje, image_url FROM posts WHERE id = 123;
```
Debería mostrar:
- `image_url`: https://i.ibb.co/ABC123/...

### Test 3: Post anónimo

1. Click + FAB
2. Categoría: "Servicios"
3. Mensaje: `Plomería urgencias 24hs`
4. Teléfono: `5491187654321`
5. ✓ Marca checkbox "Anónimo"
6. Publicar

**Verificación**:
✓ En feed: No debe mostrar "Por: tu_email"
✓ Solo: "🔒 Anónimo"

---

## ✅ PHASE 6: Interacciones

### Test 1: Votación ("Me sirve")

1. En cualquier post: Click en "👍 Me sirve"

**Verificaciones**:
✓ El número sube de 0 → 1
✓ El botón cambia color (se resalta)
✓ Si haces click de nuevo: sube a 2, 3...

✓ En **DevTools → Network**:
Busca petición POST a `/.netlify/functions/db`
- Status debería ser 200
- Body: `{ votes: X }`

✓ En **Neon**:
```sql
SELECT votes FROM posts WHERE id = tu_post_id;
```
Debería matchear el número que ves en frontend

### Test 2: Contactar por WhatsApp

1. En cualquier post: Click en "📲 Contactar"

**Verificaciones**:
✓ Se abre nueva pestaña de WhatsApp
✓ El link es: `https://wa.me/5491112345678?text=...`
✓ El teléfono en la URL es el HASH, no el número real

**En DevTools:**
```javascript
// En console, espera a que cargue el post, luego:
document.querySelector('button:contains("Contactar")')
    .getAttribute('data-phone')
# Debería mostrar el hash SHA256, no el número
```

### Test 3: Ver teléfono

✓ **En HTML visible (Ctrl+U)**: NO debe aparecer teléfono:
```html
<!-- ❌ NUNCA */
<button>📲 5491112345678</button>

<!-- ✅ SOLO así */
<button data-phone="sha256hash...">📲 Contactar</button>
```

✓ **En Network**: Los responses de API nunca incluyen teléfono en plaintext

---

## ✅ PHASE 7: Filtros

### Test 1: Filtrar por categoría

1. En feed: Click en botones de categoría:
   - 🛒 Precios
   - 🚨 Seguridad
   - 🔧 Servicios
   - ♻️ Basural

**Verificaciones**:
✓ Solo se muestran posts de esa categoría
✓ El botón se resalta (estado activo)
✓ Click de nuevo: vuelve a "Todos"

### Test 2: Filtrar por barrio

1. En header: Dropdown de barrios
2. Selecciona `Barrio San Martín` (ejemplo)

**Verificaciones**:
✓ Se filtran solo posts de ese barrio
✓ Los pins en el mapa solo aparecen en ese barrio

---

## ✅ PHASE 8: Mapa

### Test 1: Ver mapa

1. Click en ⛰️ botón Mapa (o icono de mapa en header)

**Verificaciones**:
✓ Se muestra mapa de General Rodríguez
✓ Pins de colores según categoría:
   - 🔵 Precios
   - 🔴 Seguridad
   - 🟡 Servicios
   - 🟢 Basural

✓ Click en pin: muestra popup con info del post

### Test 2: Geocodificación

1. Mira los pins - deberían estar aproximadamente en General Rodríguez
2. Zoom in/out: debería funcionar suave

---

## ✅ PHASE 9: Eliminar Post

### Test 1: Eliminar propio post

1. Crea un post
2. En el feed: Debería mostrar botón ❌ (solo si eres dueño)
3. Click en ❌

**Verificaciones**:
✓ Post desaparece del feed
✓ Confirma en **Neon**:
```sql
SELECT is_hidden FROM posts WHERE id = X;
# Debería mostrar: true (soft delete)
```

### Test 2: Intentar eliminar post ajeno

1. Logout
2. Login con OTRA cuenta
3. Busca un post de tu primera cuenta
4. No debería mostrar botón ❌

**Verificación**:
✓ No aparece el botón de eliminar

---

## ✅ PHASE 10: Panel Admin

### Setup
1. Logout
2. **CAMBIAR CONFIG en production-index.html**:
   ```javascript
   ADMIN_EMAIL: 'tu_email@gmail.com' // Pon TU email
   ```

3. Login con tu email (el mismo que en ADMIN_EMAIL)

### Test 1: Ver panel admin

1. Debería aparecer botón 👨‍⚖️ (Admin) arriba

**Verificaciones**:
✓ Si no eres admin (otro email): el botón NO aparece
✓ Si eres admin: click muestra todos los posts (incluyendo hidden)

### Test 2: Verificar post

1. En admin panel: busca un post
2. Click en ✅ "Verificar"

**Verificación**:
✓ Se marca como `is_verified: true`
✓ En feed: debería mostrar ✅ badge

### Test 3: Ocultar post

1. Admin panel: busca un post
2. Click en 👁️ "Ocultar"

**Verificación**:
✓ Post desaparece del feed para usuarios normales
✓ En admin panel: sigue visible
✓ En **Neon**:
```sql
SELECT is_hidden FROM posts WHERE id = X;
# true
```

---

## ⚠️ ERRORES COMUNES

### Error: "Clerk is not defined"
```
❌ Solución: Falta <script src="https://cdn.clerk.com/...">
✅ Verificar que está en HTML antes de tu script
```

### Error: "Cannot read property 'then' of undefined"
```
❌ Solución: API_URL incorrecto o no configurado
✅ Verificar CONFIG.API_URL es válida
✅ El backend está deployed y corriendo
```

### Error: "Invalid token"
```
❌ Solución: CLERK_SECRET_KEY incorrecto en backend
✅ Copiar exactamente de Clerk dashboard
✅ NO olvidar `Bearer ` en header
```

### Error: "Teléfono aparece en DOM"
```
❌ CRÍTICO: Teléfono está siendo renderizado en HTML
❌ Buscar en código: <div>${phone}</div>
✅ SOLO usar en atributo: data-phone="${phone}"
```

### Error: "Imagen no sube"
```
❌ Solución 1: IMGBB_API_KEY incorrecto
✅ Verificar en http://api.imgbb.com (test)

❌ Solución 2: Imagen > 10MB
✅ Usar imagen < 5MB

❌ Solución 3: CORS bloqueado
✅ ImgBB debería permitir CORS desde cualquier origen
```

### Error: "Admin panel no aparece"
```
❌ Solución: ADMIN_EMAIL no matcha con tu email en Clerk
✅ Log in con el email exacto que pusiste en CONFIG
✅ Verificar mayúsculas/minúsculas
```

---

## 🔍 DEBUG CHECKLIST

Cuando algo no funciona, repasa esto:

```javascript
// 1. Check variables de config
console.log('CONFIG:', CONFIG);

// 2. Check usuario autenticado
console.log('User:', window.Clerk.user);

// 3. Check posts en BD
fetch('API_URL?action=getPosts')
    .then(r => r.json())
    .then(console.log);

// 4. Check teléfono protegido
const posts = document.querySelectorAll('[data-post-id]');
posts.forEach(p => {
    const phone = p.querySelector('button').dataset.phone;
    console.log('Phone hash:', phone, 'Length:', phone?.length);
    // Debe tener ~64 chars (SHA256)
});

// 5. Check Network tab
// F12 → Network → Filter POST
// Busca peticiones a /.netlify/functions/db
// Status debe ser 200
// Response debe tener "statusCode": 200
```

---

## ✅ TESTING COMPLETO (CHECKLIST FINAL)

- [ ] Neon conecta y BD tiene datos
- [ ] Clerk user creado y verificado
- [ ] ImgBB API key funciona
- [ ] Backend deployed (Netlify/Vercel)
- [ ] Frontend abre sin errores
- [ ] Auth de Clerk funciona (signup/login)
- [ ] Crear post sin imagen ✅
- [ ] Crear post con imagen ✅
- [ ] Post anónimo ✅
- [ ] Votación funciona ✅
- [ ] WhatsApp link abre ✅
- [ ] Teléfono NO visible en HTML ✅
- [ ] Filtros funcionan ✅
- [ ] Mapa muestra pins ✅
- [ ] Eliminar propio post ✅
- [ ] No puedo eliminar ajeno ✅
- [ ] Admin panel aparece (si eres admin) ✅
- [ ] Admin puede verificar posts ✅
- [ ] Admin puede ocultar posts ✅

Si todo está ✅, ¡tu app está lista! 🚀

---

## 📞 Si necesitas ayuda

Captura:
1. **Error message** completo (en DevTools)
2. **Screenshot** del formulario / error
3. **¿Cuál es el último paso que funcionó?**
4. **¿Qué estabas intentando hacer?**

Con eso + este documento, resolvemos cualquier cosa 💪
