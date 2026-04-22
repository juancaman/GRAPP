# 📚 ÍNDICE COMPLETO - Rodríguez Conecta (Arquitectura Segura)

Bienvenido. Este es tu mapa de la documentación y archivos de configuración.

---

## 📂 ESTRUCTURA DE ARCHIVOS

```
production/
├── 📋 ÍNDICE DE DOCUMENTACIÓN
│   ├── INDEX.md                    ← TÚ ESTÁS AQUÍ (mapa de navegación)
│   ├── CHEAT_SHEET.md              ⭐ 10 minutos - Deploy rápido
│   ├── SETUP_INSTRUCCIONES.md      ✅ Guía paso a paso (COMPLETA)
│   ├── EXPLICACION_SEGURIDAD.md    🛡️  Cómo se cumplen los 5 requisitos
│   ├── API_REFERENCE.md            📡 Documentación de endpoints
│   └── README.md                   📖 Visión general del proyecto
│
├── 💻 CÓDIGO FRONTEND
│   └── index.html                  (HTML + CSS + JS vanilla)
│
├── ⚙️ CÓDIGO BACKEND (SERVERLESS)
│   └── api_db.js                   (Node.js - proxea a Neon)
│
├── 🗄️ BASE DE DATOS
│   └── schema.sql                  (SQL - copiar y pegar en Neon)
│
└── 🚀 CONFIGURACIÓN DEPLOYMENT
    ├── package.json                (Dependencias)
    ├── netlify.toml                (Config para Netlify)
    ├── vercel.json                 (Config para Vercel)
```

---

## 🎯 POR DÓNDE EMPEZAR

### Opción A: Tengo prisa (10 minutos)
1. Lee **`CHEAT_SHEET.md`** ⚡
2. Sigue los 4 pasos rápidos
3. Deploy en Netlify
4. ¡Listo!

### Opción B: Quiero entenderlo todo (30 minutos)
1. Lee **`README.md`** para visión general 📖
2. Lee **`SETUP_INSTRUCCIONES.md`** paso a paso ✅
3. Lee **`EXPLICACION_SEGURIDAD.md`** para los detalles 🛡️
4. Consulta **`API_REFERENCE.md`** si necesitas detalles técnicos 📡

### Opción C: Solo necesito la seguridad explicada
Lee **`EXPLICACION_SEGURIDAD.md`** aquí tienes:
- ✅ Cómo se protege el teléfono
- ✅ Cómo funciona la autenticación
- ✅ Cómo se valida la eliminación
- ✅ Cómo se controla el acceso de admin
- ✅ Ejemplos de ataques prevenidos

---

## 📖 DOCUMENTACIÓN DETALLADA

| Archivo | Propósito | Tiempo | Para quién |
|---------|-----------|--------|-----------|
| **CHEAT_SHEET.md** | Resumen de 10 minutos | ⚡ 5 min | Desarrolladores con prisa |
| **SETUP_INSTRUCCIONES.md** | Guía paso a paso 7 pasos | ✅ 30 min | Todos (RECOMENDADO) |
| **EXPLICACION_SEGURIDAD.md** | Detalle de cada requisito | 🛡️ 20 min | QA, arquitectos, auditores |
| **API_REFERENCE.md** | Documentación técnica endpoints | 📡  10 min | Desarrolladores backend |
| **README.md** | Visión general proyecto | 📖 5 min | Todos (introducción) |

---

## 💻 ARCHIVOS DE CÓDIGO

### 1. **index.html** - Frontend Completo

- **Qué es:** HTML + CSS + JavaScript vanilla (sin frameworks)
- **Tamaño:** ~12 KB
- **Secciones:**
  1. CONFIG - Variables globales (4 valores a reemplazar)
  2. AUTH (CLERK) - Gestión de sesión y autenticación
  3. IMG UPLOAD (IMGBB) - Subida de imágenes
  4. FEED - Renderizado de posts
  5. CRUD - Crear, leer, actualizar, eliminar
  6. ADMIN - Panel de moderación
  7. UI HELPERS - Utilidades (toast, modales, etc)

- **Cómo usarlo:**
  1. Copia `production/index.html`
  2. Reemplaza 4 valores en línea ~1110 (CONFIG)
  3. Sube a Netlify/Vercel
  4. ¡Listo!

---

### 2. **api_db.js** - Función Serverless

- **Qué es:** Node.js API que proxea queries a Neon PostgreSQL
- **Tamaño:** ~8 KB
- **Endpoints:**
  - GET /api/posts
  - POST /api/posts
  - DELETE /api/posts/:id
  - PATCH /api/posts/:id/verify
  - PATCH /api/posts/:id/hide
  - DELETE /api/posts/:id/admin

- **Cómo usarlo:**
  1. Copia `production/api_db.js`
  2. Para Netlify: Pega en `netlify/functions/db.js`
  3. Para Vercel: Pega en `api/db.js`
  4. Las variables de entorno se configuran en el panel de la plataforma
  5. ¡Deploy automático!

---

### 3. **schema.sql** - Base de Datos

- **Qué es:** SQL para crear tabla `posts` en Neon PostgreSQL
- **Tablas:** 2 (posts, users)
- **Índices:** 5 (para optimizar búsquedas)
- **Cómo usarlo:**
  1. Ve a https://console.neon.tech
  2. Abre tu proyecto > Editor SQL
  3. Copia TODO el contenido de `schema.sql`
  4. Pega en el editor
  5. Click "Execute"
  6. ✅ BD creada

---

## ⚙️ CONFIGURACIÓN DEPLOYMENT

### Para Netlify:

**Archivos necesarios:**
- `index.html` (en raíz)
- `netlify/functions/db.js` (copia de api_db.js)
- `netlify.toml` (configuración)
- `package.json` (dependenciasNode.js)

**Pasos:**
1. Ve a https://app.netlify.com
2. Drag & Drop la carpeta `production/`
3. Environment Variables:
   - `DATABASE_URL`
   - `CLERK_SECRET_KEY`
   - `ADMIN_EMAIL`
   - `IMGBB_API_KEY`
4. Trigger deploy
5. ✅ Deploy en ~2 minutos

### Para Vercel:

**Archivos necesarios:**
- `index.html` (en raíz)
- `api/db.js` (copia de api_db.js)
- `vercel.json` (configuración)
- `package.json` (dependencias)

**Pasos:**
1. Push a GitHub
2. Ve a https://vercel.com
3. Import repository
4. Environment Variables (4)
5. Deploy
6. ✅ Deploy en ~1 minuto

---

## 🔑 VALORES QUE NECESITAS

Antes de desplegar, obtén estos 4 valores:

| Variable | Dónde obtener | Ejemplo |
|----------|---------------|---------|
| `DATABASE_URL` | https://console.neon.tech | `postgresql://user:pwd@...` |
| `CLERK_PUBLISHABLE_KEY` | https://clerk.com (Dashboard) | `pk_test_abc123...` |
| `CLERK_SECRET_KEY` | https://clerk.com (Dashboard) | `sk_test_xyz789...` |
| `ADMIN_EMAIL` | Tu email | `admin@ejemplo.com` |
| `IMGBB_API_KEY` | https://api.imgbb.com/ | `abcd1234...` |

---

## 🛡️ SEGURIDAD (RÁPIDO)

Los 5 requisitos implementados:

1. ✅ **Teléfono no en DOM**
   - Guardado en data-attribute
   - Solo se accede al hacer click
   - Backend no devuelve a usuarios no propietarios

2. ✅ **Auth + Solo autenticados publican**
   - Clerk Email/Password
   - JWT validado en backend
   - Cada post tiene `author_id`

3. ✅ **Adjuntar fotos**
   - ImgBB API (gratis)
   - URL guardada en BD
   - Miniatura en feed

4. ✅ **Eliminar propios posts**
   - Frontend: Solo muestra botón a propietario
   - Backend: Valida `author_id == user.id`
   - DB: Ejecuta DELETE

5. ✅ **Panel Admin**
   - Frontend: Solo visible si `email === ADMIN_EMAIL`
   - Backend: Valida permisos en cada acción
   - Funciones: Verificar, ocultar, eliminar posts

**Ver detalles:** `EXPLICACION_SEGURIDAD.md`

---

## 🧪 TESTING POST-DEPLOY

```bash
# 1. Abre tu URL
https://tu-app.netlify.app/

# 2. Test completo:
✓ Carga el sitio
✓ Haz click "Ingresar"
✓ Regístrate con email/contraseña
✓ Haz click en ✏️ (FAB button)
✓ Lleña el formulario
✓ Sube una imagen
✓ Haz click "Publicar"
✓ Verifica que aparece en el feed
✓ Verifica que el botón "Contactar" abre WhatsApp
✓ Intenta eliminar: ¿ves botón "Eliminar"?
✓ Logout y vuelve a loguear como otro usuario
✓ ¿Puedes eliminar el post de otro usuario? (deberías VER el botón desactivado)

# 3. Test de admin:
✗ Logout
✗ Abre DevTools (F12)
✗ Network → Ve si aparece el panel de admin
✗ (Si tu email === ADMIN_EMAIL, deberías verlo)
```

---

## 🐛 TROUBLESHOOTING RÁPIDO

#### ❌ "Clerk no está cargado"
→ Reemplaza `CLERK_PUBLISHABLE_KEY` en `index.html` línea ~1110

#### ❌ "Error 404 /api/posts"
→ Verifica que `api_db.js` está en `netlify/functions/db.js` (o `api/db.js` en Vercel)

#### ❌ "Conexión rechazada a BD"
→ Verifica que `DATABASE_URL` en panel de variables NO tiene `/` final

#### ❌ "Las imágenes no se suben"
→ Verifica que `IMGBB_API_KEY` es correcto en `index.html`

#### ❌ "Admin no ve panel"
→ Verifica que tu email === `ADMIN_EMAIL` exactamente (case-sensitive)

**Ver más:** Busca "TROUBLESHOOTING" en `SETUP_INSTRUCCIONES.md`

---

## 📚 REFERENCIAS RÁPIDAS

### URLs Importantes

| Servicio | URL |
|----------|-----|
| Neon PostgreSQL | https://console.neon.tech |
| Clerk Auth | https://clerk.com |
| ImgBB API | https://api.imgbb.com/ |
| Netlify Deploy | https://app.netlify.com |
| Vercel Deploy | https://vercel.com |

### Puertos/URLs Locales

```
http://localhost:3000    ← Frontend local (si usas vite/webpack)
http://localhost:8000    ← Backend local (npm start)
```

### Comandos Útiles

```bash
# Instalar dependencias (Netlify/Vercel lo hace automático)
npm install

# Verificar BD en Neon
# → Va a https://console.neon.tech → SQL editor

# Ver logs de función serverless:
# Netlify → Site settings → Logs → Functions
# Vercel → Project → Functions → Logs
```

---

## ❓ PREGUNTAS FRECUENTES

**P: ¿Cuánto cuesta?**
R: Gratis en el tier gratuito:
- Netlify: 125 horas de ejecución / mes (suficiente)
- Clerk: 10,000 MAU gratis
- ImgBB: Subida ilimitada (gratis)
- Neon: 0.5 GB + 3 branches gratis

**P: ¿Es seguro en producción?**
R: Sí, con las mejores prácticas:
- HTTPS automático (Netlify/Vercel)
- JWT validado en servidor
- Queries parametrizadas (sin SQL injection)
- Variables de entorno (sin credenciales en código)

**P: ¿Puedo agregar más funcionalidades?**
R: Sí. La arquitectura es escalable:
- Agregar más endpoints en `api_db.js`
- Agregar más columnas en `schema.sql`
- Agregar más JS en `index.html`

**P: ¿Cómo hago backup de la BD?**
R: Neon lo hace automático. También:
1. En Netlify: `EXPORT /api/posts` (botón en admin panel)
2. Manualmente: `SELECT * FROM posts` en Neon console

---

## 🎉 SIGUIENTES PASOS

### Ahora (Primer Deploy)
1. Lee `CHEAT_SHEET.md` (5 min)
2. Sigue los 4 pasos (5 min)
3. Deploy en Netlify (2 min)
4. ¡Listo! 🚀

### Después (Mejoras)
- [ ] Configurar dominio personalizado
- [ ] Agregar notificaciones por email
- [ ] Agregar búsqueda full-text
- [ ] Agregar reputación de usuarios
- [ ] Agregar comentarios en posts
- [ ] Agregar geolocalización

### Producción (6 meses después)
- [ ] Monitorear logs y errores
- [ ] Optimizar imagenes (CDN)
- [ ] Agregar caching
- [ ] Agregar rate limiting
- [ ] Auditoría de seguridad

---

## 📞 SOPORTE

### Documentos de referencia
- Error en backend → Ver logs en Netlify/Vercel
- Error en frontend → Ver DevTools (F12 → Console)
- Error en BD → Ver Neon console
- Error de auth → Ver Clerk dashboard

### Comunidades
- Netlify: https://community.netlify.com/
- Vercel: https://vercel.com/support
- Clerk: https://clerk.com/support
- Neon: https://neon.tech/support

---

## ✅ CHECKLIST FINAL

Antes de compartir con usuarios:

- [ ] BD creada en Neon
- [ ] Clerk configurado (Email/Password)
- [ ] ImgBB API Key obtenida
- [ ] Variables de entorno configuradas
- [ ] `index.html` actualizado (4 valores)
- [ ] Función serverless desplegada
- [ ] HTTPS activo (automático)
- [ ] Teléfono NO en HTML (verificado en DevTools)
- [ ] Puedo crear, editar, eliminar posts
- [ ] Admin panel visible (si soy admin)
- [ ] Imágenes se suben correctamente

---

## 🎊 ¡FELICITACIONES!

Has completado tu tablero vecinal seguro, escalable y listo para producción.

**Rodríguez Conecta ahora tiene:**
✅ Autenticación moderna (Clerk)
✅ BD segura y escalable (Neon)
✅ Teléfono protegido (no en DOM)
✅ Funcionalidad de imágenes (ImgBB)
✅ Panel de admins (moderación)
✅ Deployment en Netlify/Vercel

**¿Qué sigue?**
1. Invita a 10 vecinos a probar
2. Recolecta feedback
3. Implementa mejoras
4. ¡Conecta a tu comunidad! 🏘️

---

**Última actualización:** 2026-04-15
**Versión:** 1.0.0 (MVP Seguro)
**Licencia:** MIT

🚀 **¡Vamos a conectar a General Rodríguez!**
