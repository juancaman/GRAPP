# 📡 API REFERENCE - Rodríguez Conecta

Documentación completa de los endpoints de la función serverless.

**Base URL:** `https://tu-app.netlify.app/api` (o `https://tu-app.vercel.app/api`)

---

## 🔐 AUTENTICACIÓN

Todos los endpoints requieren un header de autorización (excepto GET /posts que es público):

```
Authorization: Bearer <JWT_TOKEN_DE_CLERK>
```

El JWT se obtiene automáticamente desde el frontend cuando el usuario está logueado en Clerk.

---

## 📥 GET /posts

Obtiene todos los posts visibles (públicos).

### Request

```bash
curl -X GET https://tu-app.netlify.app/api/posts
```

### Response (200 OK)

```json
[
  {
    "id": 1,
    "title": "Oferta en panadería",
    "description": "Pan fresco a $50 hasta el jueves",
    "phone": undefined,          // ⚠️ NUNCA devuelto a usuarios publicos
    "category": "precios",
    "author_id": "user_123",
    "author_name": "Juan",
    "is_anonymous": false,
    "is_verified": false,
    "is_visible": true,
    "image_url": "https://i.ibb.co/...",
    "votes": 15,
    "created_at": "2026-04-15T10:30:00Z"
  },
  {
    "id": 2,
    "title": "Alerta: Robo en zona",
    "description": "Robos en San Martín y 9 de Julio",
    "phone": undefined,
    "category": "seguridad",
    "author_id": "user_456",
    "author_name": "Anónimo",
    "is_anonymous": true,
    "is_verified": true,
    "is_visible": true,
    "image_url": null,
    "votes": 42,
    "created_at": "2026-04-14T18:45:00Z"
  }
]
```

### Casos especiales

**Si el usuario autenticado es propietario:**
```json
{
  "id": 1,
  "phone": "+54 9 11 1234-5678",  // ✅ Sí lo verá si es el dueño
  // ... resto de campos
}
```

**Si es admin (email === ADMIN_EMAIL):**
Puede pasar `?includeHidden=true` para ver posts ocultos:
```bash
curl -X GET "https://tu-app.netlify.app/api/posts?includeHidden=true" \
  -H "Authorization: Bearer <token>"
```

---

## ✏️ POST /posts

Crea un nuevo post. **Requiere autenticación.**

### Request

```bash
curl -X POST https://tu-app.netlify.app/api/posts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "title": "Reparación de heladeras",
    "description": "Hago reparaciones de heladeras. Llamar para presupuesto.",
    "phone": "+54 9 11 2345-6789",
    "category": "servicios",
    "is_anonymous": false,
    "image_url": "https://i.ibb.co/abcd1234/imagen.jpg"
  }'
```

### Body Parameters

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `title` | string | ✅ | Título del post (máx 100 caracteres) |
| `description` | string | ✅ | Descripción (máx 500 caracteres) |
| `phone` | string | ✅ | Teléfono WhatsApp (ej: +54 9 11 1234-5678) |
| `category` | string | ✅ | Categoría: `precios`, `seguridad`, `servicios`, `basural` |
| `is_anonymous` | boolean | ❌ | Publicar como anónimo (default: false) |
| `image_url` | string | ❌ | URL de imagen (desde ImgBB) |

### Response (201 Created)

```json
{
  "id": 123,
  "title": "Reparación de heladeras",
  "description": "Hago reparaciones de heladeras. Llamar para presupuesto.",
  "phone": "+54 9 11 2345-6789",
  "category": "servicios",
  "author_id": "user_789",
  "author_name": "Carlos",
  "is_anonymous": false,
  "is_verified": false,
  "is_visible": true,
  "image_url": "https://i.ibb.co/abcd1234/imagen.jpg",
  "votes": 0,
  "created_at": "2026-04-15T14:22:00Z"
}
```

### Errores

**401 Unauthorized** - No autenticado
```json
{ "error": "No autenticado" }
```

**400 Bad Request** - Faltan campos
```json
{ "error": "Faltan campos requeridos" }
```

**500 Internal Server Error** - Error en BD
```json
{ "error": "Error creando post" }
```

---

## 🗑️ DELETE /posts/:id

Elimina un post (solo el propietario puede eliminarlo).

### Request

```bash
curl -X DELETE https://tu-app.netlify.app/api/posts/123 \
  -H "Authorization: Bearer <token>"
```

### Response (200 OK)

```json
{ "message": "Post eliminado" }
```

### Errores

**401 Unauthorized**
```json
{ "error": "No autenticado" }
```

**403 Forbidden** - No es propietario
```json
{ "error": "No tienes permiso para eliminar este post" }
```

**404 Not Found**
```json
{ "error": "Post no encontrado" }
```

---

## ✓ PATCH /posts/:id/verify

Marca un post como verificado. **Solo admin puede hacerlo.**

### Request

```bash
curl -X PATCH https://tu-app.netlify.app/api/posts/123/verify \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{ "is_verified": true }'
```

### Body

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `is_verified` | boolean | true = verificado, false = sin verificar |

### Response (200 OK)

```json
{ "message": "Post actualizado" }
```

### Errores

**403 Forbidden** - No es admin
```json
{ "error": "Solo admin puede verificar" }
```

---

## 👁️ PATCH /posts/:id/hide

Oculta o muestra un post. **Solo admin.**

### Request

```bash
curl -X PATCH https://tu-app.netlify.app/api/posts/123/hide \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{ "is_visible": false }'
```

### Body

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `is_visible` | boolean | true = visible, false = oculto |

### Response (200 OK)

```json
{ "message": "Post actualizado" }
```

### Errores

**403 Forbidden**
```json
{ "error": "Solo admin puede ocultar posts" }
```

---

## 🗑️ DELETE /posts/:id/admin

Elimina un post como admin (sin validar propietario).

### Request

```bash
curl -X DELETE https://tu-app.netlify.app/api/posts/123/admin \
  -H "Authorization: Bearer <token>"
```

### Response (200 OK)

```json
{ "message": "Post eliminado por admin" }
```

### Errores

**403 Forbidden**
```json
{ "error": "Solo admin puede eliminar posts" }
```

---

## 🧪 EJEMPLOS DE FLUJO COMPLETO

### Flujo 1: Usuario publica un aviso

```javascript
// 1. Usuario inicia sesión en Clerk (automático en la app)
const token = await window.Clerk.session.getToken();

// 2. Frontend crea el post
const postData = {
    title: "Oferta: Kinesiología",
    description: "Masajes, kinesiología, fisioterapia. Primera consulta gratis.",
    phone: "+54 9 11 3456-7890",
    category: "servicios",
    is_anonymous: false,
    image_url: "https://i.ibb.co/kinesiologia.jpg"
};

const response = await fetch('https://tu-app.netlify.app/api/posts', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(postData)
});

const newPost = await response.json();
console.log('Post creado:', newPost.id);
```

### Flujo 2: Admin verifica un aviso

```javascript
// 1. Admin obtiene el token
const token = await window.Clerk.session.getToken();

// 2. Admin marca como verificado
const response = await fetch('https://tu-app.netlify.app/api/posts/123/verify', {
    method: 'PATCH',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ is_verified: true })
});

console.log('Post verificado');
```

### Flujo 3: Usuario ve su teléfono (pero otros usuarios no)

```javascript
// El API devuelve:
// - Si eres propietario: phone = "+54 9 11 1234-5678"
// - Si NO eres propietario: phone = undefined

// En el frontend:
const posts = await fetch('/api/posts').then(r => r.json());

posts.forEach(post => {
    if (post.phone) {
        console.log('Soy el propietario, mi teléfono es:', post.phone);
    } else {
        console.log('No soy el propietario, no veo el teléfono');
        console.log('Pero puedo abrir WhatsApp con: abrirWhatsApp()');
    }
});
```

---

## 🔄 CICLO DE VIDA DE UN POST

```
1. Usuario crea post
   ↓
2. POST /api/posts (con autenticación)
   ↓
3. BD: INSERT con author_id de Clerk
   ↓
4. Post visible para todos (is_visible = true, is_verified = false)
   ↓
5a. Propietario puede eliminar: DELETE /api/posts/:id
   ↓
5b. Admin puede: PATCH /verify, PATCH /hide, DELETE /admin
   ↓
6. Post archivado o eliminado
```

---

## ⚡ PERFORMANCE

**Límites de Netlify Functions:**
- Timeout: 26 segundos (plan gratis), 900 segundos (Pro)
- Llamadas simultáneas: 200 (plan gratis)
- Tamaño máximo de payload: 6MB

**Límites de Vercel:**
- Timeout: 10 segundos (Hobby), 60 segundos (Pro)
- Tamaño máximo: 4.5MB

**Optimizaciones en el backend:**
- Índices sobre `author_id`, `category`, `created_at`
- Query LIMIT 100 posts por página
- Cache en frontend (localStorage opcional)

---

## 🛡️ SEGURIDAD

**Reglas de seguridad aplicadas:**

1. **Teléfono oculto:** No se devuelve a usuarios no propietarios
2. **Autenticación requerida:** Solo usuarios con JWT válido pueden crear
3. **Eliminación segura:** Backend valida `author_id == user.id` en server
4. **Admin aislado:** Solo `email === ADMIN_EMAIL` puede acceder a funciones de moderación
5. **SQL Injection prevention:** Queries parametrizadas con `@neondatabase/serverless`
6. **CORS:** Configurado en Netlify/Vercel

---

## 📊 STATUS CODES

| Código | Significado |
|--------|-------------|
| 200 | OK - Operación exitosa |
| 201 | Created - Recurso creado exitosamente |
| 400 | Bad Request - Parámetros inválidos |
| 401 | Unauthorized - Token no válido o falta |
| 403 | Forbidden - Permiso insuficiente |
| 404 | Not Found - Recurso no existe |
| 500 | Internal Server Error - Error en el servidor |

---

## 🧭 PRÓXIMAS LLAMADAS DESPUÉS DE DEPLOY

```bash
# 1. Test de conexión
curl https://tu-app.netlify.app/api/posts

# 2. Test de creación (necesitas token válido)
curl -X POST https://tu-app.netlify.app/api/posts \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","description":"Test","phone":"123","category":"servicios"}'

# 3. Test de logs en Netlify
# Dashboard → Logs → Functions → Observa cualquier error
```

---

**Última actualización:** 2026
**Versión API:** 1.0.0
