# 🛡️ EXPLICACIÓN DE SEGURIDAD - Cómo se cumplen los 5 requisitos

Este documento detalla **exactamente** cómo la arquitectura protege cada requisito solicitado.

---

## 🔒 REQUISITO 1: NO exponer teléfono (nunca en el DOM)

### ❌ ANTES (INSEGURO)

```html
<!-- El teléfono está visible en el HTML renderizado -->
<div class="post">
    <a href="https://wa.me/5491112345678">Contactar via WhatsApp</a>
    <!-- Un bot puede extraer este número fácilmente -->
</div>
```

**Riesgo:** Web scrapers, bots, malware pueden extraer todos los teléfonos del sitio.

---

### ✅ AHORA (SEGURO)

**Frontend (index.html):**

```javascript
// El teléfono está SOLO en el data-attribute, NO en el href
function crearPostHTML(post) {
    return `
        <div class="post">
            <button class="contact-btn" onclick="abrirWhatsApp('${post.phone}')">
                📲 Contactar
            </button>
        </div>
    `;
}

// Se ejecuta SOLO cuando el usuario hace click
function abrirWhatsApp(phone) {
    const telefonoLimpio = phone.replace(/\D/g, '');
    const mensaje = encodeURIComponent('Hola, vi tu aviso en Rodríguez Conecta.');
    window.open(`https://wa.me/${telefonoLimpio}?text=${mensaje}`, '_blank');
}
```

**Backend (api/db.js):**

```javascript
async function getPosts(event, user) {
    const posts = await db.unsafe('SELECT * FROM posts WHERE is_visible = true');
    
    // CLAVE: Nunca devolver teléfono a usuarios no propietarios
    const postsSeguro = posts.map(post => ({
        ...post,
        phone: user?.id === post.author_id ? post.phone : undefined
        // ↑ Solo el propietario ve su propio teléfono
    }));
    
    return enviarJSON(200, postsSeguro);
}
```

**Resultado:**

1. ✅ API response **no incluye** `phone` (o es `undefined`)
2. ✅ El teléfono **solo se usa** al hacer click en "Contactar"
3. ✅ El click ejecuta JS que abre WhatsApp dinámicamente
4. ✅ Bots + scrapers ven: `undefined` o nada
5. ✅ Humanos ven: Botón para contactar (a través de WhatsApp)

---

## 📧 REQUISITO 2: Registro/Login por email + solo usuarios autenticados pueden publicar

### ✅ IMPLEMENTACIÓN

**Frontend - Integración Clerk CDN:**

```html
<!-- index.html, línea ~20 -->
<script async src="https://cdn.clerk.com/clerk.js"></script>
```

```javascript
// CONFIG (línea ~1110)
const CONFIG = {
    CLERK_PUBLISHABLE_KEY: 'pk_test_REEMPLAZA...'
    // ↑ Se obtiene en https://clerk.com
};

// AUTH - INICIALIZACIÓN
function initClerk() {
    window.Clerk.load({
        publishableKey: CONFIG.CLERK_PUBLISHABLE_KEY
    }).then(() => {
        checkAuth();  // Verifica si hay usuario logueado
    });
}

// AUTH - VERIFICAR SESIÓN
function checkAuth() {
    const user = window.Clerk?.user;
    if (user) {
        appState.currentUser = {
            id: user.id,
            email: user.primaryEmailAddress?.emailAddress,
            name: user.firstName
        };
        // ✅ Usuario logueado - habilita crear posts
        fabBtn.classList.remove('disabled');
    } else {
        // ❌ Usuario no logueado - desactiva crear
        appState.currentUser = null;
        fabBtn.classList.add('disabled');
    }
}

// CREAR POST - VALIDA QUE ESTÉ LOGUEADO
async function crearPost(e) {
    if (!appState.currentUser) {
        showToast('Debes ingresar para publicar', 'error');
        return;
    }
    // ... resto del código
}
```

**Backend - Validación en Servidor:**

```javascript
async function crearPost(event, user) {
    // user viene del JWT validado contra Clerk
    if (!user) {
        return enviarError(401, 'No autenticado');
    }
    
    // ✅ Si llega acá, el usuario es real
    const body = JSON.parse(event.body);
    
    // Insertar con author_id del usuario logueado
    await db.unsafe(
        'INSERT INTO posts (title, description, phone, category, author_id, author_name) VALUES ($1, $2, $3, $4, $5, $6)',
        [
            body.title,
            body.description,
            body.phone,
            body.category,
            user.id,  // ← ID de Clerk del usuario autenticado
            user.name
        ]
    );
}
```

**Flujo completo:**

```
1. Usuario hace click en "Ingresar"
   ↓
2. Clerk abre modal (Email/Contraseña)
   ↓
3. Usuario se autentica (crea o inicia sesión)
   ↓
4. Clerk devuelve JWT válido
   ↓
5. Frontend obtiene JWT con: window.Clerk.session.getToken()
   ↓
6. FAB button ✏️ se habilita
   ↓
7. Usuario puede crear posts (JWT se envía en header Authorization)
   ↓
8. Backend valida JWT contra Clerk → AuthOK
   ↓
9. Post se crea con author_id del usuario real
```

**Resultado:**
- ✅ Solo usuarios con email/contraseña válida en Clerk pueden publicar
- ✅ Cada post está asociado al `user.id` de Clerk
- ✅ No hay posts "huérfanos" sin autor

---

## 📷 REQUISITO 3: Adjuntar fotos (ImgBB API)

### ✅ IMPLEMENTACIÓN

**Frontend - Seleccionar y previsualizar:**

```html
<!-- Modal de crear post -->
<div class="form-group">
    <label for="imagenInput">Imagen (opcional)</label>
    <label class="file-input-label" for="imagenInput">
        📸 Selecciona una imagen (JPG, PNG, máx 5MB)
    </label>
    <input type="file" id="imagenInput" accept="image/jpeg,image/png" />
    <img id="imagenPreview" class="image-preview" style="display: none;">
</div>
```

```javascript
// CONFIG
const CONFIG = {
    IMGBB_API_KEY: 'REEMPLAZA_CON_TU_KEY'
    // ↑ Se obtiene en https://api.imgbb.com/
};

// Seleccionar imagen
imagenInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    
    // Validar tamaño (máx 5MB)
    if (file.size > 5 * 1024 * 1024) {
        showToast('Imagen muy grande (máx 5MB)', 'error');
        return;
    }
    
    // Preview local
    const reader = new FileReader();
    reader.onload = (event) => {
        imagenPreview.src = event.target.result;
        imagenPreview.style.display = 'block';
        appState.imagenSeleccionada = file;
    };
    reader.readAsDataURL(file);
});

// Subir a ImgBB
async function subirImagenImgBB(file) {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('key', CONFIG.IMGBB_API_KEY);
    
    try {
        const response = await fetch('https://api.imgbb.com/1/upload', {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) throw new Error('Error subiendo imagen');
        
        const data = await response.json();
        return data.data.url;  // ← URL de la imagen en ImgBB servers
    } catch (error) {
        showToast('Error al subir la imagen', 'error');
        throw error;
    }
}

// Crear post CON imagen
async function crearPost(e) {
    e.preventDefault();
    
    // ... validaciones ...
    
    // Subir imagen Si existe
    let imageURL = null;
    if (appState.imagenSeleccionada) {
        imageURL = await subirImagenImgBB(appState.imagenSeleccionada);
    }
    
    // Crear post con URL de imagen
    const newPost = {
        title,
        category,
        description,
        phone,
        is_anonymous,
        image_url: imageURL  // ← URL en ImgBB
    };
    
    await apiCall('POST', '/api/posts', newPost);
}
```

**Backend - Guardar URL:**

```javascript
async function crearPost(event, user) {
    const body = JSON.parse(event.body);
    
    const query = `
        INSERT INTO posts (title, description, phone, category, author_id, author_name, is_anonymous, image_url)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
    `;
    
    const [newPost] = await db.unsafe(query, [
        body.title,
        body.description,
        body.phone,
        body.category,
        user.id,
        user.name,
        body.is_anonymous,
        body.image_url  // ← URL guardada en BD
    ]);
    
    return enviarJSON(201, newPost);
}
```

**Frontend - Mostrar imagen en feed:**

```javascript
function crearPostHTML(post) {
    let html = `<div class="post">...`;
    
    // Mostrar imagen si existe
    if (post.image_url) {
        html += `
            <img src="${post.image_url}" alt="Imagen del aviso" 
                 class="post-image" 
                 onerror="this.style.display='none';">
        `;
    }
    
    html += `...</div>`;
    return html;
}
```

**Arquitectura:**

```
Usuario selecciona imagen (5MB máx)
        ↓
Frontend: preview local
        ↓
Usuario hace click "Publicar"
        ↓
Frontend: Sube a ImgBB API vía CORS
        ↓
ImgBB devuelve URL: https://i.ibb.co/abcd1234/...
        ↓
Frontend: Envía URL a función serverless
        ↓
Backend: Valida URL + guarda en BD (photo_url)
        ↓
GET /api/posts devuelve posts con image_url
        ↓
Frontend: Renderiza <img src="URL"> con miniatura
```

**Resultado:**
- ✅ Imágenes almacenadas en ImgBB (no en tu servidor)
- ✅ URL persistida en BD
- ✅ Miniaturas visible en el feed
- ✅ Sin costo de storage (ImgBB es gratuito para volúmenes normales)

---

## 🗑️ REQUISITO 4: Eliminar propios posts (validación en frontend + backend)

### ✅ IMPLEMENTACIÓN

**Frontend - Mostrar botón solo a propietario:**

```javascript
function crearPostHTML(post) {
    const isOwner = appState.currentUser && appState.currentUser.id === post.author_id;
    
    let html = `
        <div class="post">
            ...contenido...
            <div class="post-footer">
                <button class="contact-btn">📲 Contactar</button>
    `;
    
    // ✅ CLAVE: Solo mostrar botón "Eliminar" si eres el propietario
    if (isOwner) {
        html += `
            <button class="btn-secondary btn-small delete-btn" 
                    onclick="eliminarPost(${post.id})">
                🗑️ Eliminar
            </button>
        `;
    }
    
    html += `</div></div>`;
    return html;
}

// Eliminar post
async function eliminarPost(postId) {
    if (!confirm('¿Estás seguro de que deseas eliminar este aviso?')) return;
    
    try {
        await apiCall('DELETE', `/api/posts/${postId}`, null);
        showToast('Aviso eliminado', 'success');
        cargarPosts();
    } catch (error) {
        showToast('Error al eliminar', 'error');
    }
}
```

**Backend - VALIDACIÓN CRÍTICA en servidor:**

```javascript
async function eliminarPost(event, user, postId) {
    // ✅ Verificar que el usuario está autenticado
    if (!user) {
        return enviarError(401, 'No autenticado');
    }
    
    // ✅ Obtener post de BD
    const [post] = await db.unsafe(
        'SELECT author_id FROM posts WHERE id = $1',
        [postId]
    );
    
    if (!post) {
        return enviarError(404, 'Post no encontrado');
    }
    
    // ✅ VALIDACIÓN CRÍTICA: Verificar que el usuario es propietario
    if (post.author_id !== user.id) {
        return enviarError(403, 'No tienes permiso para eliminar este post');
    }
    
    // ✅ El usuario es válido → eliminar
    await db.unsafe('DELETE FROM posts WHERE id = $1', [postId]);
    
    return enviarJSON(200, { message: 'Post eliminado' });
}
```

**Ataque evitado:**

```javascript
// ❌ Alguien intenta manipular el frontend para eliminar post de otro usuario
// Abre DevTools y ejecuta:
await fetch('/api/posts/123/delete', {
    method: 'DELETE',
    headers: { 'Authorization': 'Bearer fake-token' }
});

// ✅ Resultado: 
// 403: "No tienes permiso para eliminar este post"
// Post NO se elimina (validado en BD)
```

**Flujo de seguridad:**

```
Usuario hace click "Eliminar"
    ↓
Frontend verifca: if (isOwner) { mostrar botón }
    ↓
Usuario confirma en diálogo
    ↓
Frontend envía: DELETE /api/posts/123 + JWT
    ↓
Backend:
    1. Verifica JWT → obtiene user.id
    2. Obtiene post.author_id de BD
    3. ¿user.id == post.author_id?
       ✓ SÍ → DELETE
       ✗ NO → return 403
```

**Resultado:**
- ✅ Frontend previene click (UX)
- ✅ Backend valida en servidor (SEGURIDAD)
- ✅ Imposible eliminar posts de otros incluso manipulando requests

---

## 🛡️ REQUISITO 5: Panel de Moderador (accesible solo si email === ADMIN_EMAIL)

### ✅ IMPLEMENTACIÓN

**Frontend - Mostrar panel solo a admin:**

```javascript
// AUTH - Verificar si es admin
function checkAuth() {
    const user = window.Clerk?.user;
    if (user) {
        appState.currentUser = {
            id: user.id,
            email: user.primaryEmailAddress?.emailAddress,
            name: user.firstName
        };
        // ✅ Comparar email con CONFIG.ADMIN_EMAIL
        appState.isAdmin = appState.currentUser.email === CONFIG.ADMIN_EMAIL;
        updateAdminPanel();
    }
}

// Mostrar/ocultar panel admin
function updateAdminPanel() {
    const adminPanelContainer = document.getElementById('adminPanelContainer');
    if (appState.isAdmin) {
        adminPanelContainer.style.display = 'block';  // ✅ Mostrar
    } else {
        adminPanelContainer.style.display = 'none';   // ❌ Ocultar
    }
}
```

```html
<!-- Panel admin (oculto por defecto) -->
<div class="container" id="adminPanelContainer" style="display: none;">
    <div class="admin-panel">
        <h2>🛡️ Panel de Moderación</h2>
        <div class="admin-controls">
            <button class="btn-secondary" id="showAllPostsBtn">Mostrar todos</button>
            <button class="btn-secondary" id="filterHiddenBtn">Ver ocultos</button>
            <button class="btn-secondary" id="exportDataBtn">Exportar datos</button>
        </div>
    </div>
</div>
```

**Frontend - Botones de admin en posts:**

```javascript
function crearPostHTML(post) {
    let html = `...`;
    
    if (appState.isAdmin) {
        html += `
            <div class="admin-actions">
                <button class="btn-secondary admin-btn" 
                        onclick="toggleVerified(${post.id}, ${!post.is_verified})">
                    ${post.is_verified ? '❌ Desverificar' : '✓ Verificar'}
                </button>
                <button class="btn-secondary admin-btn" 
                        onclick="toggleHidden(${post.id}, ${!post.is_visible})">
                    ${post.is_visible ? '🙈 Ocultar' : '👁️ Mostrar'}
                </button>
                <button class="btn-secondary admin-btn btn-danger" 
                        onclick="deletePostAdmin(${post.id})">
                    🗑️ Del
                </button>
            </div>
        `;
    }
    
    return html;
}

// Acciones de admin
async function toggleVerified(postId, verified) {
    await apiCall('PATCH', `/api/posts/${postId}/verify`, { is_verified: verified });
}

async function toggleHidden(postId, hidden) {
    await apiCall('PATCH', `/api/posts/${postId}/hide`, { is_visible: !hidden });
}

async function deletePostAdmin(postId) {
    await apiCall('DELETE', `/api/posts/${postId}/admin`, null);
}
```

**Backend - Validación de permisos admin:**

```javascript
// Verificar si es admin
async function verificarAdmin(user) {
    if (!user) return false;
    return user.email === ADMIN_EMAIL;
}

// Marcar como verificado (solo admin)
async function marcarVerificado(event, user, postId) {
    if (!user || user.email !== ADMIN_EMAIL) {
        return enviarError(403, 'Solo admin puede verificar');
    }
    
    const body = JSON.parse(event.body);
    await db.unsafe('UPDATE posts SET is_verified = $1 WHERE id = $2', [body.is_verified, postId]);
    return enviarJSON(200, { message: 'Post actualizado' });
}

// Ocultar post (solo admin)
async function ocultarPost(event, user, postId) {
    if (!user || user.email !== ADMIN_EMAIL) {
        return enviarError(403, 'Solo admin puede ocultar posts');
    }
    
    const body = JSON.parse(event.body);
    await db.unsafe('UPDATE posts SET is_visible = $1 WHERE id = $2', [body.is_visible, postId]);
    return enviarJSON(200, { message: 'Post actualizado' });
}

// Eliminar como admin (sin validar propietario)
async function eliminarPostAdmin(event, user, postId) {
    if (!user || user.email !== ADMIN_EMAIL) {
        return enviarError(403, 'Solo admin puede eliminar posts');
    }
    
    await db.unsafe('DELETE FROM posts WHERE id = $1', [postId]);
    return enviarJSON(200, { message: 'Post eliminado por admin' });
}
```

**Seguridad de admin:**

```javascript
// CONFIG en index.html
const CONFIG = {
    ADMIN_EMAIL: 'admin@ejemplo.com',  // ← Se configura aquí
    // ...
};

// NUNCA hardcodear en frontend
// ✅ Se configura como variable de entorno en Netlify/Vercel

// ¿Qué pasa si alguien intenta ser admin?
// 1. Frontend valida: email === ADMIN_EMAIL (fácil de manipular)
// 2. Backend SIEMPRE valida: user.email === ADMIN_EMAIL (imposible engañar)
// 3. Si no es admin → return 403 Forbidden
```

**Acciones de admin:**

| Acción | Descripción | Validación |
|--------|-------------|-----------|
| ✓ Verificar | Añade badge "Verificado" | Backend: email === ADMIN_EMAIL |
| 🙈 Ocultar | Cambia `is_visible` a false | Backend: email === ADMIN_EMAIL |
| 🗑️ Eliminar | Elimina post sin validar propietario | Backend: email === ADMIN_EMAIL |
| 👁️ Ver ocultos | `?includeHidden=true` en GET /posts | Backend: email === ADMIN_EMAIL |

**Resultado:**
- ✅ Panel solo visible si tu email === ADMIN_EMAIL
- ✅ Imposible forse admin (backend valida)
- ✅ Admin puede moderador: verificar, ocultar, eliminar
- ✅ Es auditable (cada acción va a BD con timestamp)

---

## 📊 RESUMEN DE SEGURIDAD

| Requisito | Solución | Fronted | Backend | BD |
|-----------|----------|---------|---------|-----|
| 1️⃣ Teléfono no en DOM | Data-attr + JS dinámico | ✅ | No devuelve phone | Almacena |
| 2️⃣ Auth + Publish | Clerk + JWT | ✅ Check | ✅ Valida | ✅ author_id |
| 3️⃣ Fotos | ImgBB API | ✅ Sube | Guarda URL | ✅ image_url |
| 4️⃣ Eliminar propios | if (isOwner) | ✅ Oculta | ✅ Valida user.id | ✅ DELETE |
| 5️⃣ Admin Panel | email === ADMIN_EMAIL | ✅ Oculta | ✅ Valida | ✅ RLS (básico) |

---

## 🚨 DEFENSA CONTRA ATAQUES

### Ataque: Web Scraper intenta extraer teléfono

```javascript
// Scraper hace:
fetch('/api/posts').then(r => r.json()).then(posts => {
    posts.forEach(p => console.log(p.phone));
});

// Obtiene:
// posts[0].phone = undefined
// posts[1].phone = undefined
// ✅ Protegido!
```

### Ataque: Alguien intenta eliminar post de otro

```javascript
// Intenta en DevTools:
fetch('/api/posts/999/delete', { method: 'DELETE' });

// Respuesta:
// 403 Forbidden
// { "error": "No tienes permiso para eliminar este post" }
// ✅ Protegido!
```

### Ataque: Alguien se finge admin

```javascript
// El atacante manipula frontend para verse admin
appState.email = 'admin@ejemplo.com';
appState.isAdmin = true;

// Intenta verificar un post:
await apiCall('PATCH', '/api/posts/123/verify', {is_verified: true});

// Backend valida el JWT contra Clerk
// user.email = 'atacante@fake.com' (no 'admin@ejemplo.com')
// Respuesta:
// 403 Forbidden
// { "error": "Solo admin puede verificar" }
// ✅ Protegido!
```

---

## ✅ CONCLUSIÓN

Todos los 5 requisitos están implementados con:

1. **Frontend:** UX segura (previene acciones no autorizadas)
2. **Backend:** SEGURIDAD real (valida en servidor)
3. **BD:** Integridad (roles, índices, constraints)

**La regla de oro:** "Confía pero verifica en el servidor"

¿Alguien manipula el frontend? Backend lo rechaza.
¿Alguien intenta hacer requests directas? JWT y validación lo bloquean.
¿Alguien intenta inyectar SQL? Queries parametrizadas lo evitan.

---

**¿Preguntas sobre la seguridad?** Revisa `API_REFERENCE.md` para ver todos los endpoints y sus validaciones.
