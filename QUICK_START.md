# 🚀 Quick Start - Rodríguez Conecta

## 5 Minutos para Empezar

### 1. Clonar/Descargar

```bash
git clone https://github.com/tuusuario/rodriguez-conecta.git
cd rodriguez-conecta
```

### 2. Crear `.env.local`

```env
# Base de Datos (Neon)
DATABASE_URL=postgresql://user:password@ep-xxxxx-xxxxx.neon.tech/neon

# Autenticación (Clerk)
CLERK_PUBLISHABLE_KEY=pk_live_xxxxxxxx
CLERK_SECRET_KEY=sk_live_xxxxxxxx

# Imágenes (ImgBB)
VITE_IMGBB_KEY=xxxxxxxxxxxxxxxxxxxxxxxx

# Admin
VITE_ADMIN_EMAIL=tuemailadmin@gmail.com

# API (para producción)
VITE_API_URL=https://tu-dominio.com/api/db
```

### 3. Instalar Dependencias

```bash
npm install
npm install @neondatabase/serverless jose
```

### 4. Desarrollo Local

```bash
npm run dev
# http://localhost:5173
```

### 5. Deploy a Netlify

```bash
npm install -g netlify-cli

netlify deploy --prod
# Sigue el asistente
```

---

## 📋 Configuración de Envs por Plataforma

### Netlify

**Dashboard → Site Settings → Build & Deploy → Environment**

```
DATABASE_URL = postgresql://...
CLERK_SECRET_KEY = sk_live_...
VITE_IMGBB_KEY = xxx...
VITE_ADMIN_EMAIL = admin@domain.com
```

### Vercel

**Project Settings → Environment Variables**

```
Name: DATABASE_URL
Value: postgresql://...
Environments: Production, Preview, Development
```

---

## 🧪 Testing Rápido

### 1. Test Clerk Auth

```javascript
// En consola del navegador
Clerk.user
// Debería retornar { id, email, firstName, ... }

await Clerk.session.getToken()
// Debería retornar JWT token
```

### 2. Test API

```bash
# Obtener todos los posts
curl https://tu-dominio.com/api/db?action=GET_POSTS

# Crear post (necesita JWT)
JWT=$(curl -X POST https://clerk.com/api/validate_session ... | jq -r '.jwt')

curl -X POST https://tu-dominio.com/api/db \
  -H "Authorization: Bearer $JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "CREATE_POST",
    "category": "precios",
    "message": "Test post"
  }'
```

### 3. Test Admin Panel

```
1. Asegúrate VITE_ADMIN_EMAIL sea tu email en Clerk
2. Login con ese email
3. Aparecerá botón "Panel Admin"
4. Deberías ver tabla con todos los posts
```

### 4. Test Foto

```
1. Crear post nuevo
2. Seleccionar archivo imagen
3. Esperar "✅ Foto lista"
4. Ver miniatura en preview
5. Publicar
6. Verificar imagen en feed
```

### 5. Test WhatsApp Oculto

```
1. Crear post CON teléfono
2. Inspeccionar elemento (F12)
3. VERIFICAR: No aparece el número en HTML
4. Hacer clic en "Contactar"
5. Debería abrir WhatsApp con mensaje
```

---

## 🔥 Troubleshooting Rápido

| Problema | Solución |
|----------|----------|
| "Cargando..." en auth | Verifica CLERK_PUBLISHABLE_KEY en index.html |
| Post falla al crear | Revisa console (F12) → Network → ERROR response |
| Foto no sube | Verifica VITE_IMGBB_KEY en .env |
| Admin panel no aparece | VITE_ADMIN_EMAIL debe coincidir exacto con Clerk email |
| 401 Unauthorized | JWT inválido, verifica CLERK_SECRET_KEY en backend |
| CORS error | La plataforma (Netlify/Vercel) maneja auto, espera a deploy |

---

## 📦 Archivos Clave

```
rodriguez-conecta/
├── index.html              # Frontend + Clerk + ImgBB
├── api/
│   └── db.js              # Backend serverless
├── netlify.toml           # Config Netlify
├── vercel.json            # Config Vercel (si usas)
├── .env.local             # Variables locales (NO commitear)
└── README.md              # Este archivo
```

---

## 🎯 Deploy Final Checklist

```
[ ] .env.local creado
[ ] npm install ejecutado
[ ] npm run dev funciona localmente
[ ] Clerk modal aparece
[ ] Puedes hacer login
[ ] Puedes crear post
[ ] Foto se carga
[ ] Botón "Contactar" abre WhatsApp
[ ] Panel admin visible (si eres admin)
[ ] netlify.toml o vercel.json existe
[ ] Deploy ejecutado sin errores
```

---

## 📱 Endpoints API

### Públicos (sin autenticación)

```
GET /api/db?action=GET_POSTS
Retorna: { posts: [...] }
```

### Autenticados (requieren JWT)

```
POST /api/db
{
  "action": "CREATE_POST",
  "category": "precios|seguridad|servicios|basural",
  "message": "Tu mensaje",
  "phone": "+54 9 1234 567890",  // opcional
  "image_url": "https://imgbb.com/...",  // opcional
  "is_anonymous": false
}

POST /api/db
{
  "action": "DELETE_POST",
  "post_id": 123
}
```

### Solo Admin

```
GET /api/db?action=GET_ALL_POSTS
Retorna: { posts: [...] } (incluso ocultos)

POST /api/db
{
  "action": "TOGGLE_VERIFIED",
  "post_id": 123
}

POST /api/db
{
  "action": "TOGGLE_VISIBLE",
  "post_id": 123
}

POST /api/db
{
  "action": "ADMIN_DELETE_POST",
  "post_id": 123
}
```

---

## 🏗️ Estructura de una Respuesta

### Exitosa

```json
{
  "post": {
    "id": 1,
    "user_id": "user_123",
    "user_email": "user@example.com",
    "category": "precios",
    "message": "Leche a $80",
    "phone": "+54 9 1234 567890",
    "image_url": "https://imgbb.com/...",
    "is_anonymous": false,
    "is_verified": false,
    "is_visible": true,
    "created_at": "2026-04-15T10:30:00Z"
  }
}
```

### Error

```json
{
  "error": "Mensaje descriptivo del error"
}
```

---

## 🔐 Recordar (SEGURIDAD)

1. **NUNCA** commitear `.env` al repositorio
   ```bash
   echo ".env.local" >> .gitignore
   ```

2. **NUNCA** exponer `DATABASE_URL` en frontend
   - Solo va en `api/db.js` (backend)

3. **NUNCA** renderizar teléfono en HTML
   - Solo en memoria JS

4. **SIEMPRE** validar JWT en backend
   ```javascript
   const user = await verifyClerkToken(authHeader);
   if (!user) return response(401, ...);
   ```

5. **SIEMPRE** validar ownership en SQL
   ```sql
   DELETE FROM posts WHERE id = $1 AND user_id = $2;
   ```

---

## 🚀 Próximas Funcionalidades

- [ ] Búsqueda por palabras clave
- [ ] Geolocalización (mapa Leaflet)
- [ ] Notificaciones en tiempo real (WebSockets)
- [ ] Sistema de puntuación/reputación
- [ ] Mensajes privados entre usuarios
- [ ] Feed personalizado por barrio
- [ ] Reportar posts inapropiados

---

## 📞 Support

Documentación completa en:
- `RODRIGUEZ_CONECTA_SETUP_COMPLETO.md` - Setup detallado
- `SEGURIDAD_DETALLADA.md` - Explicación de seguridad
- [Clerk Docs](https://clerk.com/docs)
- [Neon Docs](https://neon.tech/docs)

---

**¡Listo para desplegarte! 🎉**
