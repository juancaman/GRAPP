# 🛡️ Arquitectura de Seguridad - Rodríguez Conecta

## Introducción

Este documento detalla cómo "Rodríguez Conecta" cumple los 5 requisitos de seguridad usando Vanilla JS + Clerk + Neon + Netlify/Vercel.

---

## 1️⃣ Teléfono OCULTO en DOM

### Requisito
> **NUNCA renderizar el número en el DOM. El botón "Contactar" genera `https://wa.me/NUMERO?text=...` solo al hacer clic.**

### Implementación

#### ❌ **Cómo NO hacerlo** (Inseguro)

```html
<!-- NUNCA HAGAS ESTO -->
<div class="post">
    <p>Teléfono: <span id="phone">+54 9 1234 567890</span></p>
    <a href="https://wa.me/541234567890">Contactar</a>
</div>

<script>
// El número está en el HTML - visible en inspector + scrapeado por bots
</script>
```

**Problemas**:
- Visible en "Inspeccionar elemento"
- Bots web pueden scrapear números
- Almacenado en source maps
- Historiales del navegador

#### ✅ **Cómo hacerlo** (Seguro)

```html
<!-- CORRECTO -->
<div class="post">
    <p>Vendedor disponible para contactar</p>
    <button onclick="contactWhatsApp(123)">📱 Contactar</button>
</div>

<script>
// El número está en JavaScript MEMORY, no en DOM
let allPosts = [
    { 
        id: 123, 
        message: "Vendo leche",
        phone: "+54 9 1234 567890"  // ← En memoria JS, NO en HTML
    }
];

async function contactWhatsApp(postId) {
    const post = allPosts.find(p => p.id === postId);
    if (!post || !post.phone) return;
    
    // El número se genera AQUÍ, en memoria, al hacer clic
    const phoneNumber = post.phone.replace(/\D/g, ''); // Solo dígitos
    
    // URL nunca se renderiza, solo se abre
    const waUrl = `https://wa.me/${phoneNumber}?text=Hola`;
    window.open(waUrl, '_blank');
}
</script>
```

**Protecciones**:
1. ✅ Número en `allPosts[]` array (memoria JS)
2. ✅ Jamás agregado al DOM
3. ✅ URL `wa.me/` se abre solo en nueva ventana
4. ✅ No aparece en "Inspeccionar"
5. ✅ No se cachea en HTML

#### 📊 Verificación (Inspector de Navegador)

```bash
# En consola:
document.body.innerText  # No contiene el número
allPosts[0].phone       # ← Contiene el número (en memoria)

# Cuando haces clic:
# 1. Genera URL en memoria
# 2. Abre ventana (window.open)
# 3. URL NO permanece en DOM
```

### Backend (api/db.js) - Almacenamiento

```javascript
async function createPost(user_id, ..., phone, ...) {
    const query = `
        INSERT INTO posts (user_id, category, message, phone, ...)
        VALUES ($1, $2, $3, $4, ...)
        RETURNING *;
    `;
    
    // phone se almacena en plain text en Neon
    // ALTERNATIVA (más seguro): Encriptar antes de guardar
}
```

**Nota**: Actualmente se almacena en plain text. Para más seguridad:

```javascript
// UPGRADE: Encriptar teléfono
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY; // 32 bytes hex

function encryptPhone(phone) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
    let encrypted = cipher.update(phone, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
}

function decryptPhone(encrypted) {
    const parts = encrypted.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
    let decrypted = decipher.update(parts[1], 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}
```

---

## 2️⃣ Registro/Login por Email (Clerk)

### Requisito
> **Usá Clerk (CDN). Solo usuarios autenticados pueden publicar/gestionar avisos.**

### Implementación

#### Frontend - Clerk Integration

```html
<!-- En index.html -->
<script async src="https://cdn.clerk.com/clerk.browser.js"></script>

<div id="authModal" class="modal show">
    <div class="modal-content">
        <div id="clerkContainer"></div>
    </div>
</div>

<script>
async function initClerk() {
    await Clerk.load();
    const user = Clerk.user;
    
    if (user) {
        // Usuario autenticado
        document.getElementById('authModal').classList.remove('show');
        document.getElementById('mainContent').classList.remove('hidden');
        currentUser = {
            id: user.id,
            email: user.primaryEmailAddress?.emailAddress,
            name: user.fullName
        };
    } else {
        // Mostrar modal Clerk
        document.getElementById('authModal').classList.add('show');
    }
}

initClerk();
</script>
```

#### Protección de Rutas Autenticadas

```javascript
// submitPost() - Solo autenticados pueden publicar
async function submitPost(event) {
    if (!currentUser) {
        showAlert('Debes estar autenticado para publicar.', 'error');
        return;
    }
    
    // Obtener JWT de Clerk
    const token = await Clerk.session.getToken();
    
    // Enviar a backend
    const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            action: 'CREATE_POST',
            category,
            message,
            ...
        })
    });
}
```

#### Backend - JWT Verification

```javascript
// api/db.js
import { jwtVerify } from 'jose';

const CLERK_SECRET_KEY = new TextEncoder().encode(
    process.env.CLERK_SECRET_KEY
);

async function verifyClerkToken(token) {
    try {
        const bearerToken = token.replace('Bearer ', '');
        const verified = await jwtVerify(bearerToken, CLERK_SECRET_KEY);
        return verified.payload; // { sub: user_id, email, ... }
    } catch (error) {
        console.error('Token inválido:', error);
        return null;
    }
}

// Handler
export async function handler(event) {
    const authHeader = event.headers.authorization || '';
    const user = await verifyClerkToken(authHeader);
    
    if (!user) {
        return response(401, { error: 'No autenticado' });
    }
    
    // Aquí user.sub = user_id, user.email, etc.
    // Proceder con operación segura
}
```

#### Flujo de Autenticación

```
1. Usuario ingresa email + password en Clerk Modal
2. Clerk valida credenciales (client-side seguro)
3. Clerk genera JWT firmado (con CLERK_SECRET_KEY)
4. Frontend almacena JWT en Clerk.session
5. En cada request: headers Authorization: Bearer <JWT>
6. Backend verifica firma del JWT
7. Backend autoriza operación
```

#### Variables de Entorno

```env
# Producción (Netlify/Vercel)
CLERK_PUBLISHABLE_KEY=pk_live_xxxxxxxx
CLERK_SECRET_KEY=sk_live_xxxxxxxx

# El secret key NUNCA va al frontend
# Solo el publishable key en cliente
```

---

## 3️⃣ Adjuntar 1 Foto por Aviso (ImgBB)

### Requisito
> **Usar API pública de ImgBB. Mostrar miniatura en feed con fallback.**

### Implementación

#### Upload a ImgBB (Frontend)

```javascript
async function uploadToImgBB(file) {
    if (!IMGBB_KEY) {
        showAlert('ImgBB no configurado', 'info');
        return;
    }
    
    const formData = new FormData();
    formData.append('image', file);
    
    try {
        // Llamada directa a ImgBB (no pasa por nuestro backend)
        const response = await fetch(
            `https://api.imgbb.com/1/upload?key=${IMGBB_KEY}`,
            {
                method: 'POST',
                body: formData
            }
        );
        
        if (!response.ok) throw new Error('Error ImgBB');
        
        const data = await response.json();
        currentImageData = data.data.url; // URL de la imagen
        
        document.getElementById('uploadStatus').textContent = '✅ Foto lista';
    } catch (error) {
        document.getElementById('uploadStatus').textContent = '❌ Error al subir';
    }
}
```

#### Almacenar URL en DB

```javascript
// Cuando se crea el post, se guarda la URL
const response = await fetch(API_URL, {
    method: 'POST',
    body: JSON.stringify({
        action: 'CREATE_POST',
        category,
        message,
        image_url: currentImageData, // ← URL de ImgBB
        ...
    })
});
```

#### Backend - Guardar URL

```javascript
// api/db.js
async function createPost(..., image_url, ...) {
    const query = `
        INSERT INTO posts (..., image_url, ...)
        VALUES (..., $5, ...)
        RETURNING *;
    `;
    
    const result = await pool.query(query, [
        ...,
        image_url || null, // Puede ser NULL
        ...
    ]);
    
    return result.rows[0];
}
```

#### Renderizar en Feed

```javascript
function renderFeed(posts) {
    // ... en el HTML generado:
    
    ${post.image_url ? `
        <img 
            src="${post.image_url}" 
            alt="Aviso" 
            class="post-image"
            onerror="this.classList.add('error'); this.textContent='Foto no disponible';"
        >
    ` : ''}
}
```

#### Fallback (Si falla carga)

```css
.post-image.error {
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #e0e7ff, #ddd6fe);
    color: #666;
    font-size: 0.875rem;
    min-height: 200px;
}
```

**Ventajas de ImgBB**:
- ✅ Almacenamiento externo (no consume tu servidor)
- ✅ CDN global (imágenes cargadas rápido)
- ✅ Límite generoso (gratuito)
- ✅ API simple
- ⚠️ Sin encriptación de imágenes

**Alternativas**:
- Cloudinary: Más features, transformaciones
- AWS S3: Más caro, más control
- Vercel Blob: Si usas Vercel

---

## 4️⃣ Eliminar Propios (Ownership)

### Requisito
> **Cada usuario solo ve "Eliminar" en sus avisos. Validar ownership por `user_id`.**

### Implementación

#### Frontend - Mostrar Botón Solo a Propietario

```javascript
function renderFeed(posts) {
    return posts.map(post => {
        const isOwner = currentUser && currentUser.id === post.user_id;
        const isAdmin = currentUser && currentUser.email === ADMIN_EMAIL;
        
        return `
            <div class="glass-card post-card">
                <div class="post-header">
                    ...
                    <div class="post-actions">
                        ${isOwner || isAdmin ? `
                            <button 
                                class="btn-danger" 
                                onclick="deletePost(${post.id})"
                            >
                                Eliminar
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}
```

**Importante**: El botón SOLO aparece si `currentUser.id === post.user_id`

#### Frontend - Enviar Solicitud de Eliminación

```javascript
async function deletePost(postId) {
    if (!confirm('¿Eliminar este aviso?')) return;
    
    try {
        const token = await Clerk.session.getToken();
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'DELETE_POST',
                post_id: postId
            })
        });
        
        if (!response.ok) throw new Error('Error al eliminar');
        
        showAlert('✅ Aviso eliminado', 'success');
        await loadPosts();
    } catch (error) {
        showAlert(`Error: ${error.message}`, 'error');
    }
}
```

#### Backend - Validar Ownership

```javascript
// api/db.js
async function deletePost(postId, userId, isAdmin = false) {
    try {
        let query;
        let params;
        
        if (isAdmin) {
            // Admin puede eliminar cualquier post
            query = 'DELETE FROM posts WHERE id = $1 RETURNING *;';
            params = [postId];
        } else {
            // Usuario SOLO puede eliminar SU post
            query = 'DELETE FROM posts WHERE id = $1 AND user_id = $2 RETURNING *;';
            params = [postId, userId];
        }
        
        const result = await pool.query(query, params);
        
        if (result.rows.length === 0) {
            throw new Error('Post no encontrado o sin permiso');
        }
        
        return result.rows[0];
    } catch (error) {
        throw error;
    }
}

// En handler:
const user = await verifyClerkToken(authHeader); // {sub, email}
const isAdmin = user.email === ADMIN_EMAIL;

if (action === 'DELETE_POST') {
    const { post_id } = body;
    const post = await deletePost(post_id, user.sub, isAdmin);
    return response(200, { post });
}
```

#### Base de Datos - Verificación Adicional

```sql
-- Información del post
SELECT id, user_id, message FROM posts WHERE id = 123;

-- Si el usuario intenta delete sin ser propietario:
DELETE FROM posts WHERE id = 123 AND user_id = 'OTRO_USER';
-- ↑ No retorna nada (0 filas afectadas)
```

---

## 5️⃣ Panel Admin (Acceso Restringido)

### Requisito
> **Panel Admin (`?admin=true`): Accesible solo si `user.email === "TU_EMAIL_ADMIN@dominio.com"`. Muestra lista completa con botones "Ocultar", "Eliminar", "Verificado".**

### Implementación

#### Frontend - Detección de Admin

```javascript
// En initClerk()
if (user) {
    currentUser = {
        id: user.id,
        email: user.primaryEmailAddress?.emailAddress,
        name: user.fullName
    };
    
    // Si es admin, mostrar botón
    if (currentUser.email === ADMIN_EMAIL) {
        document.getElementById('adminBtn').classList.remove('hidden');
    }
}
```

#### Frontend - Acceso al Panel

```javascript
function goToAdmin() {
    // Validar permiso AQUÍ también (no confiar solo en frontend)
    if (currentUser?.email !== ADMIN_EMAIL) {
        showAlert('No tienes permiso', 'error');
        return;
    }
    
    // Mostrar panel
    document.getElementById('mainContent').classList.add('hidden');
    document.getElementById('adminPanel').classList.remove('hidden');
    loadAdminPosts();
}

async function loadAdminPosts() {
    try {
        const token = await Clerk.session.getToken();
        const response = await fetch(`${API_URL}?action=GET_ALL_POSTS`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        // Renderizar tabla con todos los posts (incluso ocultos)
        renderAdminTable(data.posts);
    } catch (error) {
        showAlert(`Error: ${error.message}`, 'error');
    }
}
```

#### Backend - Restricción de Admin

```javascript
// api/db.js

// En handler:
const user = await verifyClerkToken(authHeader);
const isAdmin = user.email === ADMIN_EMAIL;

// GET_ALL_POSTS - Solo admin
if (action === 'GET_ALL_POSTS' && isAdmin) {
    const posts = await getPosts(false); // false = mostrar todos, incluso ocultos
    return response(200, { posts });
} else if (action === 'GET_ALL_POSTS' && !isAdmin) {
    return response(403, { error: 'No es admin' });
}

// TOGGLE_VERIFIED - Solo admin
if (action === 'TOGGLE_VERIFIED' && isAdmin) {
    const { post_id } = body;
    const post = await toggleVerified(post_id, true);
    return response(200, { post });
} else if (action === 'TOGGLE_VERIFIED' && !isAdmin) {
    return response(403, { error: 'No es admin' });
}
```

#### Acciones del Admin

```javascript
// 1. Marcar como Verificado
async function toggleVerified(postId) {
    const token = await Clerk.session.getToken();
    await fetch(API_URL, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
            action: 'TOGGLE_VERIFIED',
            post_id: postId
        })
    });
}

// 2. Ocultar/Mostrar
async function toggleVisible(postId) {
    const token = await Clerk.session.getToken();
    await fetch(API_URL, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
            action: 'TOGGLE_VISIBLE',
            post_id: postId
        })
    });
}

// 3. Eliminar como Admin
async function adminDeletePost(postId) {
    if (!confirm('¿Eliminar?')) return;
    
    const token = await Clerk.session.getToken();
    await fetch(API_URL, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
            action: 'ADMIN_DELETE_POST',
            post_id: postId
        })
    });
}
```

#### SQL - Operaciones del Admin

```sql
-- Ver todos los posts (incluso ocultos)
SELECT * FROM posts ORDER BY created_at DESC;

-- Marcar como verificado
UPDATE posts SET is_verified = NOT is_verified WHERE id = 123;

-- Ocultar post
UPDATE posts SET is_visible = FALSE WHERE id = 123;

-- Mostrar post
UPDATE posts SET is_visible = TRUE WHERE id = 123;

-- Eliminar post
DELETE FROM posts WHERE id = 123;
```

#### Variables de Entorno

```env
# En Netlify/Vercel
VITE_ADMIN_EMAIL=admin@tudominio.com
```

```javascript
// En index.html
const ADMIN_EMAIL = process.env.VITE_ADMIN_EMAIL || 'admin@example.com';
```

---

## 🔐 Resumen de Seguridad Multicapa

```
CAPA 1: Frontend
├─ Clerk Auth modal
├─ Teléfono en memoria, no en DOM
├─ Validación de forma (client-side)
└─ Verificación de permisos (para UX)

CAPA 2: API (Serverless)
├─ JWT verification
├─ Email whitelist para admin
├─ Ownership validation en queries SQL
└─ Error handling sin exponer DB

CAPA 3: Database (Neon)
├─ user_id en cada post
├─ Índices para performance
├─ Timestamps automáticos
└─ Plain text passwords NO (Clerk maneja)

CAPA 4: Plataforma (Netlify/Vercel)
├─ HTTPS forzado
├─ CORS headers
├─ Rate limiting automático
└─ Secrets management
```

---

## ⚠️ Seguridad en Producción (Checklist)

```
[ ] HTTPS habilitado (Netlify/Vercel lo hace auto)
[ ] DATABASE_URL nunca en repositorio (use .env)
[ ] CLERK_SECRET_KEY nunca en frontend (solo backend)
[ ] IMGBB_KEY rotado regularmente
[ ] Admin email verificado en sistema
[ ] Logs monitoreados en serverless functions
[ ] Backups de Neon configurados
[ ] Rate limiting en API
[ ] Content Security Policy (CSP) headers
[ ] Helmet.js o similar para headers
```

---

## 📚 Referencias

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Clerk Security](https://clerk.com/docs/security)
- [Neon Security](https://neon.tech/docs/manage/security)
- [SQL Injection Prevention](https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html)

---

**Nota**: Esta arquitectura es segura para uso comunitario. Para producción a escala, considerar:
- Encriptación de teléfonos (AES-256)
- 2FA en admin
- Auditoría de logs
- Penetration testing
- Monitoreo de anomalías
