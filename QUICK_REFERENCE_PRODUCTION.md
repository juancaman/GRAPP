# ⚡ QUICK REFERENCE - Rodríguez Conecta (Production)

## 📋 SETUP - 4 VARIABLES A REEMPLAZAR

Estas van en `production-index.html` línea ~300, en el objeto `CONFIG`:

```javascript
const CONFIG = {
    CLERK_PUBLISHABLE_KEY: 'pk_live_c12d3e4f5g6h7i8j9k0l1m2n3o4p5q6r7s',  // ← Nº1
    API_URL: 'https://tu-app.netlify.app/.netlify/functions/db',           // ← Nº2
    IMGBB_API_KEY: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9',           // ← Nº3
    ADMIN_EMAIL: 'tu_email@gmail.com'                                      // ← Nº4
};
```

### 1️⃣ CLERK_PUBLISHABLE_KEY
**Dónde encontrarlo**:
1. Abre https://dashboard.clerk.com
2. Ve a "API Keys"
3. Copia "Publishable Key" (empieza con `pk_live_` o `pk_test_`)
4. Pégalo aquí sin comillas extras

**Verificar**: Debería empezar con `pk_` y tener ~50 caracteres

### 2️⃣ API_URL
**Tu backend serverless URL**:
- **Netlify**: `https://tu-app.netlify.app/.netlify/functions/db`
- **Vercel**: `https://tu-app.vercel.app/api/db`

**¿Dónde está?**:
- Netlify: En dashboard > Site Settings > Site details > URL
- Vercel: En dashboard > Deployments > copy URL

**Verificar**: Debería ser tu dominio + `/functions/db` (Netlify) o `/api/db` (Vercel)

### 3️⃣ IMGBB_API_KEY
**Dónde encontrarlo**:
1. Abre https://imgbb.com
2. Haz login / signup
3. Ve a https://api.imgbb.com
4. Copia "Image Upload API"
5. Pégalo aquí

**Verificar**: Debería tener ~30 caracteres, solo alfanuméricos

### 4️⃣ ADMIN_EMAIL
**Tu email**:
- El que usaste en Clerk
- Ejemplo: `tuombre@gmail.com`
- DEBE matchear exactamente (mayúscula/minúscula)

**Verificar**: Debería ser el email que usas para login

---

## 🔗 URLS IMPORTANTES

| Servicio | URL | Usuario |
|----------|-----|---------|
| Clerk | https://dashboard.clerk.com | signup first |
| Neon | https://console.neon.tech | signup first |
| ImgBB | https://api.imgbb.com | signup first |
| Netlify | https://app.netlify.com | or Vercel.com |
| Tu app | https://tu-app.netlify.app | (after deploy) |

---

## 🏗️ ARCHIVOS QUÉ REEMPLAZAR

| Archivo | Acción | Línea |
|---------|--------|-------|
| `production-index.html` | Reemplaza 4 variables en CONFIG | ~300 |
| `api/db.js` o `netlify/functions/db.js` | Reemplaza `DATABASE_URL`, `CLERK_SECRET_KEY`, `ADMIN_EMAIL` | ~5-15 |
| `SQL_SCHEMA_NEON.sql` | Copiar y pegar en Neon console | N/A |

---

## 🚀 DEPLOYMENT STEPS (RESUMEN)

### Paso 1: Setup Neon
```bash
1. Abre https://console.neon.tech
2. Crea proyecto "rodriguez-conecta"
3. Copia DATABASE_URL (connection string)
4. Abre SQL Editor
5. Pega contenido de SQL_SCHEMA_NEON.sql
6. Ejecuta (presiona ▶️)
✓ Verifica: SELECT COUNT(*) FROM posts; debe devolver 1
```

### Paso 2: Setup Clerk
```bash
1. Abre https://dashboard.clerk.com
2. Create Application
3. Enable "Email/Password"
4. Copia Publishable Key (para CONFIG)
5. Copia Secret Key (para backend)
```

### Paso 3: Setup ImgBB
```bash
1. Abre https://imgbb.com
2. Signup/Login
3. Ve a https://api.imgbb.com
4. Copia API Key
```

### Paso 4: Deploy Backend
```bash
# OPCIÓN A: Netlify
1. Crear repo en GitHub con api-db.js
2. Abre https://app.netlify.com
3. "Connect to Git"
4. Selecciona repo
5. Environment Variables:
   - DATABASE_URL = (de Neon)
   - CLERK_SECRET_KEY = (de Clerk)
   - ADMIN_EMAIL = tu_email

# OPCIÓN B: Vercel
1. Exportar code a GitHub
2. Abre https://vercel.com
3. "Import Project from Git"
4. Admin mismo environment
```

### Paso 5: Deploy Frontend
```bash
1. Abre production-index.html
2. Reemplaza 4 variables en CONFIG (línea ~300)
3. Opción A: Netlify drag & drop
4. Opción B: Vercel drag & drop
5. O conectar a GitHub
```

### Paso 6: Test
```bash
1. Abre app en navegador
2. Signup / Login
3. Crear post
4. Verificar en Neon: SELECT * FROM posts;
5. ✓ Done!
```

---

## 🐛 DEBUG RÁPIDO

### "Clerk is not defined"
```
❌ El script de Clerk no cargó
✅ Abre DevTools (F12) → Network tab
✅ Busca "clerk.js"
✅ Si es rojo = error de CORS, contactar Clerk
```

### "Cannot POST to function"
```
❌ Backend no está corriendo o URL es incorrecta
✅ Abre: https://tu-app.netlify.app/.netlify/functions/db
✅ En el navegador debería mostrar JSON
```

### "Cannot hash image"
```
❌ ImgBB key incorrecto o imagen muy grande
✅ Verifica IMGBB_API_KEY en CONFIG
✅ La imagen debe ser < 10MB
```

### "No puedo crear post"
```
❌ No estás autenticado O las 4 variables están mal
✅ Abre DevTools → Console
✅ console.log(CONFIG)
✅ console.log(window.Clerk.user)
✅ Ambos deben tener valores
```

### "Teléfono visible en HTML"
```
❌ CRÍTICO: Brecha de seguridad
❌ No renderices nunca: <div>${phone}</div>
✅ SOLO: <button data-phone="${phone}">Contact</button>
```

---

## 📊 ESTRUCTURA ARCHIVOS (DÓNDE VA CADA UNO)

```
Raíz de tu proyecto:
├── production-index.html          ← Publicar en Netlify/Vercel
├── netlify.toml                   ← Config de Netlify (si usas)
└── netlify/
    └── functions/
        └── db.js                  ← Backend function (deploy automático)
        
O para Vercel:
├── production-index.html          ← root deployment
└── api/
    └── db.js                      ← Backend function

Base de datos (Neon):
└── Ejecuta SQL_SCHEMA_NEON.sql en consola
```

---

## 🔐 SEGURIDAD - CHECKLIST

- [ ] ¿El teléfono está hasheado en BD? (phone_hash)
- [ ] ¿El teléfono NO aparece en HTML visible? (Ctrl+U)
- [ ] ¿El teléfono está en atributo data-*? (data-phone)
- [ ] ¿El JWT valida en cada request?
- [ ] ¿El admin_email valida en backend?
- [ ] ¿DATABASE_URL NO está en frontend?
- [ ] ¿CLERK_SECRET_KEY está solo en backend?

---

## 📱 TESTING RÁPIDO

```javascript
// Abrir DevTools (F12) y pega en console:

// 1. Verificar config
CONFIG

// 2. Verificar usuario
window.Clerk.user

// 3. Crear post fake (test)
const testPost = {
    categoria: 'precios',
    mensaje: 'Test - Lechuga $100',
    phone_hash: 'abc123xyz...',
    votes: 0
};
console.log('Test post:', testPost);

// 4. Verificar teléfono en DOM
document.body.innerText.includes('5491234567')
// Debe ser FALSE ✓

// 5. Ver todos los posts
fetch(CONFIG.API_URL + '?action=getPosts')
    .then(r => r.json())
    .then(d => console.log('Posts:', d))
```

---

## 📞 CONTACTAR SERVICIO

| Problema | Contactar | Link |
|----------|-----------|------|
| Auth no funciona | Clerk | https://dashboard.clerk.com/support |
| BD caída | Neon | https://console.neon.tech |
| Imagen no sube | ImgBB | https://api.imgbb.com |
| Deploy fallido | Netlify/Vercel | https://app.netlify.com o vercel.com |

---

## 💡 TIPS

### Tip 1: Test sin frontend
```bash
curl -X GET "https://tu-app.netlify.app/.netlify/functions/db?action=getPosts"
```
Si devuelve JSON = backend OK

### Tip 2: Verificar hash
```javascript
// SHA256 de un teléfono debe ser:
const crypto = require('crypto');
const phone = '5491234567';
const hash = crypto.createHash('sha256').update(phone).digest('hex');
console.log(hash); // Debería tener 64 caracteres
```

### Tip 3: Reset de BD
```sql
-- En Neon console
TRUNCATE TABLE posts RESTART IDENTITY;
-- Luego inserta seed:
INSERT INTO posts (categoria, mensaje, phone_hash) 
VALUES ('precios', 'Test post', 'abc...');
```

### Tip 4: Ver logs del backend
- **Netlify**: App.netlify.com → Site → Functions → db → logs
- **Vercel**: Dashboard → Deployments → test function → logs

---

## 📊 LÍMITES FREE TIER

| Servicio | Límite |
|----------|--------|
| Neon | 0.5 GB storage (suficiente para 1000+ posts) |
| Clerk | 100+ users free |
| ImgBB | ~10GB storage free |
| Netlify | 160 build min/mes |
| Vercel | 100GB bandwidth/mes |

Si pasas límites = upgrade 💳

---

## 🚨 EMERGENCIA: "TODO BROKE"

1. ¿El frontend carga?
   - SÍ → Ve a paso 2
   - NO → Verifica production-index.html está bien formato

2. ¿Puedo hacer login?
   - SÍ → Ve a paso 3
   - NO → Verificar CLERK_PUBLISHABLE_KEY en CONFIG

3. ¿Puedo crear post?
   - SÍ → Ve a paso 4
   - NO → Verificar API_URL y backend deployed

4. ¿Aparece el post en BD?
   - SÍ → ¡Todo ok! Issue en frontend solo
   - NO → Ver logs del backend (Netlify/Vercel)

---

## 📞 ANTES DE ESCRIBIR A SOPORTE

Captura:
1. Screenshot del error
2. Línea exacta del error (DevTools error message)
3. ¿Qué URL visitaste? (cliente o backend)
4. ¿Qué pasos hiciste antes del error?
5. ¿Qué variables reemplazaste correctamente? (mark ✓)

---

**ÚLTIMA ACTUALIZACIÓN**: Hoy  
**STATUS**: 🟢 Production Ready  
**VERSIÓN**: 1.0.0  

¡Buena suerte! 🚀
