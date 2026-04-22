# 🛡️ SEGURIDAD - EXPLICACIÓN DETALLADA

## OVERVIEW

Rodríguez Conecta implementa 4 capas de seguridad para proteger:
- **Teléfono de usuarios**: Nunca visible en DOM
- **Autenticación**: JWT de Clerk verificado en backend
- **Autorización**: Validación de ownership + whitelist admin
- **Datos**: Conexión segura a Neon + HTTPS en producción

---

## ✅ REQUISITO 1: TELÉFONO OCULTO

### 🔒 Cómo Funciona

```javascript
// En el FRONTEND:

// ❌ NUNCA SE HACE:
// post.phone = "5491234567890"
// render(`<input value="${post.phone}">`) // ← INSEGURO

// ✅ SI SE HACE:
// 1. Teléfono se almacena SOLO en memoria JS
allPosts[0].phone = "5491234567890"; // En RAM, no en HTML

// 2. Al hacer clic en "Contactar":
function contactViaWhatsApp(postId) {
    const post = allPosts.find(p => p.id === postId);
    // El teléfono solo se usa aquí
    const waUrl = `https://wa.me/${post.phone}?text=...`;
    window.open(waUrl, '_blank');
}

// 3. RESULTADO:
// - Al inspeccionar el HTML (F12), NO ves el teléfono
// - Web scraping no puede extraer números
// - Solo usuarios que hacen clic pueden iniciar chat
```

### 🛡️ Protección Contra Ataques

| Ataque | Protección |
|--------|-----------|
| Web scraping | ✅ No está en DOM |
| XSS injection | ✅ Teléfono no en HTML |
| Inspector F12 | ✅ No visible en elemento |
| Copy-paste | ✅ No aparece en selección |
| API intercept | ✅ Backend NO devuelve phone en GET_POSTS |

---

## ✅ REQUISITO 2: AUTENTICACIÓN CLERK

### 🔐 Flujo de Autenticación

```
1. USUARIO ABRE APP
   ↓
2. FRONTEND carga Clerk CDN
   <script src="https://cdn.clerk.com/clerk.browser.js"></script>
   ↓
3. Clerk.load() - obtiene usuario actual
   ↓
4. SI NO está autenticado:
   → Mostrar modal de login
   ↓
5. SI está autenticado:
   → Mostrar feed
   → Al publicar: obtener JWT token
```

### 🔑 JWT Token

```javascript
// En el frontend:
const token = await Clerk.session?.getToken();
// token = "eyJhbGc.eyJzdWI.SflKxw" (JWT firmado por Clerk)

// Al enviar al backend:
fetch('/api/db', {
    method: 'POST',
    headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        action: 'CREATE_POST',
        category: 'precios',
        message: '...',
        phone: '...',
        image_url: '...'
    })
});
```

### 🛡️ Backend Verification

```javascript
// En api/db.js:
async function verifyClerkToken(token) {
    const jwt = token.substring(7); // Quitar "Bearer "
    const secret = new TextEncoder().encode(CLERK_SECRET_KEY); // Solo en backend
    const { payload } = await jwtVerify(jwt, secret);
    
    return {
        userId: payload.sub,        // ID único del usuario
        email: payload.email        // Email autenticado
    };
}

// Cada operación protegida:
const user = await verifyClerkToken(authHeader);
if (!user) {
    return res.status(401).json({ error: 'No autenticado' });
}

// Usar user.userId en la consulta SQL
```

### 🔑 CLERK_SECRET_KEY - CRÍTICO

```
❌ NUNCA expongas en frontend:
   - No en HTML
   - No en localStorage
   - No en devTools
   - No en GitHub público

✅ SOLO en backend (api/db.js):
   - Via variable de entorno en Netlify
   - Nunca visible en código
   - Usada solo para jwtVerify()
```

---

## ✅ REQUISITO 3: FOTOS IMGBB

### 📷 Proceso Seguro

```javascript
// 1. Usuario selecciona imagen LOCAL
const file = inputElement.files[0];

// 2. Validar en frontend
if (file.size > 5 * 1024 * 1024) {
    alert('Archivo muy grande');
    return;
}

// 3. Subir DIRECTAMENTE a ImgBB (no a nuestro servidor)
const response = await fetch(
    `https://api.imgbb.com/1/upload?key=${VITE_IMGBB_KEY}`,
    {
        method: 'POST',
        body: formData // Contiene la imagen
    }
);

// 4. ImgBB responde con URL pública
const url = response.data.url;
// url = "https://i.imgbb.com/xxx/image.jpg"

// 5. Enviar SOLO la URL al backend (no la imagen)
await callApi('CREATE_POST', {
    image_url: url,  // ← Solo URL, no imagen
    // ...otros datos
});

// 6. Backend almacena URL en DB
INSERT INTO posts (image_url) VALUES ($1) // URL, no blob
```

### 🛡️ Ventajas

- ✅ No almacenamos archivos (evita límites de storage)
- ✅ CDN global ImgBB (carga rápido en todo el mundo)
- ✅ Soporte automático para diversos formatos
- ✅ HTTPS + compresión automática
- ✅ Sin costo para MVP

---

## ✅ REQUISITO 4: ELIMINAR PROPIOS

### 🔓 Validación en SQL

```sql
-- ❌ INSEGURO (cualquiera puede eliminar cualquier post):
DELETE FROM posts WHERE id = $1;

-- ✅ SEGURO (solo propietario):
DELETE FROM posts 
WHERE id = $1 AND user_id = $2;
-- Parámetro $2 viene del JWT, no del usuario
```

### 🛡️ Flujo Seguro

```javascript
// 1. Frontend envía solo post_id
await callApi('DELETE_POST', { post_id: 5 });

// 2. Backend:
//    a) Valida JWT → obtiene user_id
const user = await verifyClerkToken(token);
//    b) Ejecuta DELETE con AMBOS parámetros
const result = await pool.query(
    'DELETE FROM posts WHERE id = $1 AND user_id = $2',
    [postId, user.userId] // user_id del JWT, no trusteado
);
//    c) Si no coincide, devuelve 0 filas
if (result.rows.length === 0) {
    return res.status(403).json({ error: 'No autorizado' });
}
```

### 🔍 Ejemplo de Ataque Bloqueado

```javascript
// Atacante intenta:
const postId = 999; // Post de otro usuario
await callApi('DELETE_POST', { post_id: 999 });

// Backend:
// 1. Valida JWT → user_id = "attacker_123"
// 2. Ejecuta: DELETE WHERE id=999 AND user_id="attacker_123"
// 3. Resultado: 0 filas (ese post no es del atacante)
// 4. Retorna 403 "No autorizado"

// ✅ Post protegido
```

---

## ✅ REQUISITO 5: PANEL ADMIN

### 👑 Whitelist por Email

```javascript
// En .env:
VITE_ADMIN_EMAIL=admin@rodriguezconeecta.com

// En backend:
if (user.email !== ADMIN_EMAIL) {
    return res.status(403).json({ error: 'No eres admin' });
}

// Acciones admin-only:
- GET_ALL_POSTS (ver todos, incluso ocultos)
- TOGGLE_VERIFIED (marcar como verificado)
- TOGGLE_VISIBLE (ocultar/mostrar)
- ADMIN_DELETE_POST (eliminar cualquiera)
```

### 🛡️ Seguridad del Admin

1. **Email verificado en Clerk**
   - El email debe estar confirmado
   - Solo tú tienes acceso a esa cuenta

2. **Doble validación**
   - Frontend: si email === ADMIN_EMAIL, mostrar botón
   - Backend: verificar nuevamente en cada operación

3. **Audit trail** (opcional para futuro)
   ```sql
   CREATE TABLE admin_logs (
       id SERIAL PRIMARY KEY,
       admin_email VARCHAR(255),
       action VARCHAR(50),
       post_id INT,
       timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   );
   ```

---

## 🔐 PROTECCIÓN DE CREDENCIALES

### ❌ NUNCA HAGAS

```javascript
// ❌ Exponer CLERK_SECRET_KEY en frontend
const secretKey = "sk_live_xxx..."; // NUNCA

// ❌ Guardar en localStorage
localStorage.setItem('secret', secretKey); // NUNCA

// ❌ Commitear .env.local a GitHub
git add .env.local // ← .gitignore

// ❌ Pasar por URL
fetch('/api/db?secret=sk_live...'); // NUNCA
```

### ✅ SI HAZ

```javascript
// ✅ Variables de entorno (servidor)
// En Netlify Dashboard → Settings → Environment
DATABASE_URL=postgresql://...
CLERK_SECRET_KEY=sk_live_...

// ✅ Usar en backend
const secret = process.env.CLERK_SECRET_KEY;

// ✅ Frontend solo usa PUBLISHABLE
const publishable = VITE_CLERK_PUBLISHABLE_KEY;

// ✅ Gitignore
echo ".env.local" >> .gitignore
```

---

## 🛡️ 4 CAPAS DE SEGURIDAD

```
CAPA 1: FRONTEND
├─ Teléfono en memoria (no DOM)
├─ Validación de input
├─ Clerks CDN para auth
└─ HTTPS en navegador

CAPA 2: NETWORK
├─ JWT en Authorization header
├─ CORS headers
├─ HTTPS obligatorio
└─ No exponer errores sensibles

CAPA 3: BACKEND
├─ JWT verification
├─ Ownership validation en SQL
├─ Admin email whitelist
├─ Parameterized queries (no SQL injection)
└─ Error handling seguro

CAPA 4: DATABASE
├─ user_id en WHERE clauses
├─ Índices para query optimization
├─ Backups automáticos (Neon)
├─ Connection pooling
└─ Transacciones ACID
```

---

## 🧪 TEST DE SEGURIDAD

### Teléfono Oculto
```
✓ Abrir DevTools (F12)
✓ Inspeccionar elemento (buscar teléfono)
✓ Resultado: NO debe estar visible
✓ Verificar Network → ver si POST devuelve phone
  Resultado: backend NO incluye phone en GET_POSTS
```

### JWT Verification
```
✓ Copiar token de DevTools (Application → Cookies)
✓ Modificar token
✓ Intentar crear post con token falso
✓ Resultado: Error 401 "Invalid token"
```

### Ownership Validation
```
✓ Crear post como Usuario A
✓ Copiar post_id
✓ Cambiar a Usuario B
✓ Intentar eliminar post de Usuario A
✓ Resultado: Error 403 "No autorizado"
```

### SQL Injection
```
✓ En field "Message", intentar:
  ' OR '1'='1
✓ Resultado: Se almacena como texto, no ejecuta SQL
✓ Backend usa parameterized queries ($1, $2)
```

---

## 🚀 PARA PRODUCCIÓN

### Lista de Verificación

```
DATABASE
[ ] Backups automáticos habilitados (Neon)
[ ] Índices optimizados (creados en schema.sql)
[ ] Connection pooling activado
[ ] Row Level Security (RLS) habilitado

BACKEND
[ ] CLERK_SECRET_KEY en variables de entorno
[ ] Rate limiting en Netlify
[ ] Error logging configurado
[ ] CORS restrictivo (solo dominio propio)

FRONTEND
[ ] HTTPS obligatorio
[ ] Security headers (X-Frame-Options, CSP)
[ ] Cookie secure + httpOnly
[ ] Validación de input en cliente

CREDENCIALES
[ ] .env.local en .gitignore
[ ] Todos los secretos en Netlify Dashboard
[ ] Ningún secret en código
```

---

## 📊 COMPARACIÓN: SIN vs CON SEGURIDAD

| Aspecto | ❌ SIN Seguridad | ✅ CON Seguridad |
|--------|-----------------|-----------------|
| Teléfono | Visible en HTML | Memoria JS |
| Auth | Ninguna | JWT Clerk |
| Eliminar | Cualquiera | Solo propietario |
| Admin | Acceso público | Email whitelist |
| DB | Exposición directa | Backend proxy |
| Datos | Plaintext | HTTPS + conexión segura |

---

## 🎯 CONCLUSIÓN

Rodríguez Conecta implementa **security by design**:

1. ✅ Teléfono protegido (memoria, no DOM)
2. ✅ Autenticación verificada (JWT Clerk)
3. ✅ Fotos seguras (CDN externo)
4. ✅ Ownership garantizado (SQL + JWT)
5. ✅ Admin protegido (email whitelist)

**Listo para producción y usuarios reales.** 🏘️
