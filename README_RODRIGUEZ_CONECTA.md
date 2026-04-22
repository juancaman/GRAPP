# 🏘️ Rodríguez Conecta

### Panel Vecinal Social + Seguro

Una plataforma para que los vecinos de General Rodríguez (Argentina) compartan ofertas, alertas de seguridad, servicios y avisos locales.

---

## ⚡ Quick Start (5 minutos)

```bash
# 1. Clonar/descargar
cd rodriguez-conecta

# 2. Setup env vars
cp .env.local.example .env.local
# Editar .env.local con tus claves

# 3. Instalar
npm install
npm install @neondatabase/serverless jose

# 4. Dev local
npm run dev
# http://localhost:5173

# 5. Deploy
netlify deploy --prod
```

Más detalles: [`QUICK_START.md`](QUICK_START.md)

---

## 🎯 5 Requisitos ✅

### ✅ 1. Teléfono OCULTO
- Número **nunca** en el DOM
- Generado al hacer clic en "Contactar"
- Abre WhatsApp en nueva ventana
- Seguro contra web scraping

### ✅ 2. Autenticación (Clerk)
- Login/Signup por email
- Solo usuarios autenticados publican
- JWT verification en backend
- Seguro, probado, escalable

### ✅ 3. Fotos (ImgBB)
- Upload a API pública
- Miniatura en feed
- Fallback si falla
- Gratuito y CDN global

### ✅ 4. Eliminar Propios
- Botón solo en tus posts
- Backend valida ownership
- Admins pueden eliminar cualquiera
- Confirmación antes de borrar

### ✅ 5. Panel Admin
- Acceso por email whitelist
- Ver todos los posts (incluso ocultos)
- Botones: Verificar, Ocultar, Eliminar
- Filtrar por categoría

---

## 🏗️ Arquitectura

```
┌─────────────────────┐
│   Frontend (HTML)   │
│  Clerk + ImgBB      │
│  Vanilla JS         │
└────────┬────────────┘
         │ JWT
         ↓
┌─────────────────────┐
│ Serverless (Node)   │
│ api/db.js           │
│ Netlify Functions   │
└────────┬────────────┘
         │ SQL
         ↓
┌─────────────────────┐
│ PostgreSQL (Neon)   │
│ posts table         │
│ índices + triggers  │
└─────────────────────┘
```

---

## 🔐 Seguridad Multicapa

| Capa | Medida |
|------|--------|
| **Frontend** | Teléfono en memoria (no DOM), validación input |
| **Backend** | JWT verification, ownership validation |
| **DB** | user_id en queries, índices, triggers |
| **Plataforma** | HTTPS, CORS headers, secrets management |

Más detalles: [`SEGURIDAD_DETALLADA.md`](SEGURIDAD_DETALLADA.md)

---

## 📦 Stack Tecnológico

- **Frontend**: Vanilla JS + HTML/CSS
- **Backend**: Node.js Serverless
- **Database**: PostgreSQL (Neon)
- **Auth**: Clerk
- **Images**: ImgBB
- **Hosting**: Netlify / Vercel
- **API**: RESTful

---

## 📋 Documentación

| Documento | Para | Tiempo |
|-----------|------|--------|
| [`QUICK_START.md`](QUICK_START.md) | Rápido | 5 min |
| [`GUIA_NETLIFY_PASO_A_PASO.md`](GUIA_NETLIFY_PASO_A_PASO.md) | Principiantes | 15 min |
| [`RODRIGUEZ_CONECTA_SETUP_COMPLETO.md`](RODRIGUEZ_CONECTA_SETUP_COMPLETO.md) | Completo | 30 min |
| [`SEGURIDAD_DETALLADA.md`](SEGURIDAD_DETALLADA.md) | Técnico | 20 min |
| [`INDICE_DOCUMENTACION.md`](INDICE_DOCUMENTACION.md) | Navegación | 5 min |

---

## 🚀 Deploy

### Opción A: Netlify (RECOMENDADO)

```bash
npm install -g netlify-cli
netlify login
netlify deploy --prod
```

Guía completa: [`GUIA_NETLIFY_PASO_A_PASO.md`](GUIA_NETLIFY_PASO_A_PASO.md)

### Opción B: Vercel

```bash
npm install -g vercel
vercel
# Sigue el asistente
```

---

## 🔧 Configuración

### Variables de Entorno

Crear `.env.local`:

```env
DATABASE_URL=postgresql://...         # Neon
CLERK_PUBLISHABLE_KEY=pk_live_...    # Clerk
CLERK_SECRET_KEY=sk_live_...         # Clerk
VITE_IMGBB_KEY=xxx...                # ImgBB
VITE_ADMIN_EMAIL=admin@example.com   # Tu email
```

### Setup Base de Datos

Ejecutar en Neon SQL Editor:

```sql
-- Ver: NEON_SCHEMA.sql
```

---

## ✨ Features

### Usuarios
- ✅ Ver todos los posts públicos
- ✅ Filtrar por categoría
- ✅ Crear posts (autenticados)
- ✅ Subir foto
- ✅ Publicar anónimo
- ✅ Contactar por WhatsApp
- ✅ Eliminar propios

### Admins
- ✅ Panel admin protegido
- ✅ Ver todos (incluso ocultos)
- ✅ Marcar como "Verificado"
- ✅ Ocultar/Mostrar posts
- ✅ Eliminar cualquiera

---

## 🧪 Testing

```bash
# Local
npm run dev

# Checklist:
# [ ] Clerk login funciona
# [ ] Crear post
# [ ] Subir foto
# [ ] Contactar WhatsApp
# [ ] Teléfono NO en HTML
# [ ] Eliminar propio
# [ ] Panel admin (si admin)
```

Más detalles: [`RODRIGUEZ_CONECTA_SETUP_COMPLETO.md`](RODRIGUEZ_CONECTA_SETUP_COMPLETO.md)

---

## 📊 Estructura

```
rodriguez-conecta/
├── index.html                      # Frontend completo
├── api/db.js                       # Backend serverless
├── netlify.toml                    # Config Netlify
├── vercel.json                     # Config Vercel
├── .env.local.example              # Template env vars
├── NEON_SCHEMA.sql                 # SQL schema
│
├── QUICK_START.md                  # 5 minutos
├── GUIA_NETLIFY_PASO_A_PASO.md     # Setup detallado
├── RODRIGUEZ_CONECTA_SETUP_COMPLETO.md
├── SEGURIDAD_DETALLADA.md
├── RESUMEN_ENTREGA.md
├── INDICE_DOCUMENTACION.md
└── README.md                       # Este archivo
```

---

## 🎯 Requisitos Previos

- Node.js 18+
- Npm/yarn
- Cuenta Neon (https://neon.tech)
- Cuenta Clerk (https://clerk.com)
- Cuenta ImgBB (https://imgbb.com)
- Cuenta Netlify/Vercel

---

## 🔗 Categorías

- 💰 **Precios**: Ofertas, descuentos
- 🚨 **Seguridad**: Alertas, incidentes
- 🔧 **Servicios**: Profesionales, ayuda
- 🗑️ **Basural**: Cosas gratis/donadas

---

## 🌍 Ubicación

**Proyecto**: General Rodríguez, Buenos Aires, Argentina  
**Barrio**: Multiple (filtrable en futuros)

---

## 📱 Características

- ✅ Mobile-first responsive
- ✅ Glassmorphism design
- ✅ Dark/Light ready
- ✅ Animaciones suaves
- ✅ Accesibilidad (WCAG)
- ✅ PWA ready
- ✅ Performance optimizado

---

## 💬 Categorías de Posts

**Ejemplos:**

```
💰 Leche a $80 en Almacén García
🚨 Se vio sospechoso anoche en la estación
🔧 Electricista con 20 años - consultas gratis
🗑️ Heladera gratis para quien la retire
```

---

## 🔒 Seguridad

### Protecciones Incluidas

1. **Teléfono Seguro**: Nunca en DOM
2. **Auth**: JWT firmado con Clerk
3. **Database**: Validación ownership
4. **Admin**: Whitelist por email
5. **HTTPS**: Forzado en producción

**Detalles**: [`SEGURIDAD_DETALLADA.md`](SEGURIDAD_DETALLADA.md)

---

## 🚀 Próximo Pasos

### Corto Plazo
- Encripción de teléfonos
- Validación CAPTCHA
- Rate limiting

### Mediano Plazo
- Notificaciones real-time
- Búsqueda full-text
- Sistema reputación

### Largo Plazo
- Geolocalización
- App móvil
- IA moderation

---

## 📈 Escalabilidad

- ✅ Serverless auto-scaling
- ✅ Database connection pooling
- ✅ CDN para imágenes
- ✅ Caching optimizado
- ✅ Índices optimizados

---

## 💰 Costos

### Gratuito
- ✅ Neon: 5GB free
- ✅ Clerk: 10k monthly events
- ✅ ImgBB: 200 uploads/hora
- ✅ Netlify: Unlimited deploys

### Total mes: **$0 USD** (para <1k usuarios)

---

## 📞 Soporte

1. Lee: [`INDICE_DOCUMENTACION.md`](INDICE_DOCUMENTACION.md)
2. Busca tu caso en troubleshooting
3. Consulta la documentación específica
4. Revisa logs de Netlify/Vercel

---

## 🎓 Aprendizaje

Aprenderás:
- Serverless architecture
- JWT authentication
- PostgreSQL + SQL
- Web security
- Frontend seguro
- CI/CD deployment
- API integrations

---

## 📝 Licencia

Libre para usar, modificar y distribuir en tu comunidad.

---

## 👨‍💻 Créditos

Construido con:
- Vanilla JavaScript
- PostgreSQL
- Clerk
- ImgBB
- Netlify/Vercel

---

## 🤝 Contribuir

Este es un proyecto comunitario. Si tienes mejoras:

1. Fork el repo
2. Crea feature branch
3. Commit cambios
4. Push y haz PR

---

## 📧 Contacto

**Comunidad**: General Rodríguez, Argentina  
**Email**: contacto@rodrigezconecta.com *(futuro)*

---

## ✅ Checklist Deploy

```
[ ] .env.local creado
[ ] npm install ejecutado
[ ] npm run dev funciona
[ ] Neon BD creada
[ ] Clerk app creada
[ ] ImgBB key obtenida
[ ] netlify.toml presente
[ ] Listo para deploy
```

---

## 🎉 ¡Empecemos!

**Primeros pasos:**

1. Lee: [`QUICK_START.md`](QUICK_START.md) (5 min)
2. O lee: [`GUIA_NETLIFY_PASO_A_PASO.md`](GUIA_NETLIFY_PASO_A_PASO.md) (15 min)
3. Deploy
4. ¡Invita a tus vecinos!

---

**Versión**: 1.0  
**Status**: ✅ Completo y funcional  
**Última actualización**: Abril 2026

---

## 📚 Más Documentación

- [`QUICK_START.md`](QUICK_START.md) - Inicio rápido
- [`RODRIGUEZ_CONECTA_SETUP_COMPLETO.md`](RODRIGUEZ_CONECTA_SETUP_COMPLETO.md) - Setup detallado
- [`SEGURIDAD_DETALLADA.md`](SEGURIDAD_DETALLADA.md) - Arquitectura segura
- [`INDICE_DOCUMENTACION.md`](INDICE_DOCUMENTACION.md) - Índice completo

---

**¡A conectar con tus vecinos! 🏘️**
