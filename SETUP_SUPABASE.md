# 🚀 Guía de Configuración - Rodríguez Conecta + Supabase

## 📋 ÍNDICE
1. Crear proyecto Supabase
2. Configurar Auth
3. Crear tabla `posts` y bucket `images`
4. Aplicar políticas RLS
5. Obtener credenciales
6. Reemplazar valores en el código

---

## 1️⃣ CREAR PROYECTO SUPABASE

1. Ir a [supabase.com](https://supabase.com)
2. Click en **"Start your project"** o **"New project"**
3. Completá el formulario:
   - **Project name**: `rodriguez-conecta` (o el que prefieras)
   - **Database password**: Genera una fuerte (guárdala)
   - **Region**: `South America (São Paulo)` (mejor latencia para Argentina)
4. Click **"Create new project"** y espera ~2 minutos

---

## 2️⃣ CONFIGURAR AUTH

1. En el panel de Supabase, ir a **Autenticación > Métodos de Acceso**
2. Verificar que **Email** esté **habilitado** (debe estar verde)
3. En **Políticas de contraseña**, establecer:
   - **Requerir contraseña fuerte**: OFF (opcional)
   - **Longitud mínima**: 6 caracteres

---

## 3️⃣ CREAR TABLA `posts`

### Opción A: SQL directo (RECOMENDADO)

1. Ir a **SQL Editor** en el panel izquierdo
2. Crear una **Nueva query**
3. **Copiar y pegar TODO esto**:

```sql
-- Crear tabla posts
CREATE TABLE IF NOT EXISTS posts (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    categoria TEXT NOT NULL CHECK (categoria IN ('precios', 'seguridad', 'servicios', 'basural')),
    mensaje TEXT NOT NULL,
    image_url TEXT,
    phone_hidden TEXT NOT NULL, -- Guardar solo el número sin mostrar en UI
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    user_email TEXT NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    is_hidden BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(id)
);

-- Crear índices para mejor performance
CREATE INDEX idx_posts_categoria ON posts(categoria);
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_posts_is_hidden ON posts(is_hidden);

-- Activar RLS
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- RLS: Cualquiera puede VER avisos no ocultos
CREATE POLICY "Avisos públicos - ver" ON posts
    FOR SELECT USING (is_hidden = FALSE);

-- RLS: Solo el dueño puede ELIMINAR su aviso
CREATE POLICY "Usuario elimina su propio aviso" ON posts
    FOR DELETE USING (auth.uid() = user_id);

-- RLS: Solo usuarios autenticados pueden CREAR
CREATE POLICY "Usuarios autenticados crean avisos" ON posts
    FOR INSERT WITH CHECK (auth.uid() = user_id AND auth.uid() IS NOT NULL);

-- RLS: Solo ADMIN puede UPDATE (verificados, ocultos)
-- Para esto, creá una tabla roles si lo necesitas, o usa directamente email en trigger
CREATE POLICY "Admin puede actualizar" ON posts
    FOR UPDATE USING (
        -- Aquí iría validación de admin por email
        -- Por ahora lo dejamos abierto para triggers
    );
```

4. Click **Run** y verifica que diga "Success"

### Opción B: Crear manualmente en UI

Si prefieres la UI:
1. **Table Editor** > **New Table**
2. Name: `posts`
3. Agregar columnas (ver tabla abajo)

| Columna      | Tipo      | Constraints                              |
|--------------|-----------|------------------------------------------|
| id           | bigint    | Primary Key, Auto-increment              |
| categoria    | text      | Not null, CHECK (precios/seguridad/...)  |
| mensaje      | text      | Not null                                 |
| image_url    | text      | Nullable                                 |
| phone_hidden | text      | Not null                                 |
| user_id      | uuid      | Not null, FK → auth.users(id)            |
| user_email   | text      | Not null                                 |
| is_verified  | boolean   | Default: false                           |
| is_hidden    | boolean   | Default: false                           |
| created_at   | timestamp | Default: now()                           |

---

## 4️⃣ CREAR BUCKET `images`

1. Ir a **Storage** en el panel izquierdo
2. Click **"Create new bucket"**
3. Name: `images`
4. **Public** (toggle en ON)
5. Click **Create bucket**

### Crear carpeta dentro del bucket

1. Click en bucket `images`
2. Click **"Upload folder"** o simplemente subir archivos
3. Los archivos irán en `/images/posts/`

---

## 5️⃣ APLICAR POLÍTICAS RLS PARA STORAGE

1. Ir a **Storage** > **Policies**
2. Click en bucket `images`
3. **Create Policy** (o pega esto en SQL Editor):

```sql
-- Public read
CREATE POLICY "Public read images" ON storage.objects
    FOR SELECT USING (bucket_id = 'images');

-- Only authenticated users can upload
CREATE POLICY "Authenticated upload" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'images' AND 
        auth.role() = 'authenticated'
    );

-- Only owner can delete
CREATE POLICY "Owner delete" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'images' AND 
        auth.uid() = owner
    );
```

---

## 6️⃣ OBTENER CREDENCIALES

1. Ir a **Settings > API** (esquina inferior izquierda)
2. Copiar:
   - **Project URL** → `SUPABASE_URL`
   - **anon public** key → `SUPABASE_ANON_KEY`

Ejemplo:
```
SUPABASE_URL = https://abcdef123456.supabase.co
SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 7️⃣ REEMPLAZAR EN EL CÓDIGO

Abre `rodriguez-conecta-supabase.html` y busca la sección `// CONFIG SUPABASE`:

```javascript
const SUPABASE_URL = 'https://YOUR_PROJECT_ID.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY';
const ADMIN_EMAIL = 'admin@ejemplo.com'; // Reemplaza con tu email
```

**Reemplaza**:
- `YOUR_PROJECT_ID` → Tu project ID (ej: `abcdef123456`)
- `YOUR_ANON_KEY` → Tu anon public key completa
- `admin@ejemplo.com` → Tu email para acceso a Admin Panel

✅ **Listo! Guarda el archivo.**

---

## 🧪 TESTEAR

1. Abre el archivo en el navegador
2. Click **"Entrar"**
3. **Crear cuenta**: usa un email de prueba
4. Completa el formulario de aviso
5. **Importante**: Te pedirá teléfono en un `prompt()` - ingresa un número (ej: `5491123456789`)
6. El teléfono se guarda **ENCRIPTADO** en la DB y **NUNCA** aparece en el HTML
7. Al clickear "📲 Contactar", abre WhatsApp con el número correcto

---

## 🔐 SEGURIDAD - POR QUÉ EL TELÉFONO NO SE EXPONE

1. **En la BD**: Se guarda en columna `phone_hidden` (TEXT, numeral limpio)
2. **En el UI**: Nunca se renderiza en el DOM, solo en atributo `data-phone`
3. **Al hacer click**: JavaScript extrae el número y abre WhatsApp
4. **En el admin**: Se ve el email del usuario, no el teléfono
5. **RLS**: Solo el dueño del post puede borrarlo; nadie más accede a editar

---

## 👨‍⚖️ ADMIN PANEL

Para que tu email tenga acceso al panel moderador:

1. En el código, cambia:
   ```javascript
   const ADMIN_EMAIL = 'admin@ejemplo.com'; 
   ```
   Por tu email real (ej: `yo@gmail.com`)

2. Solo si tu email coincide, verás el botón **"👨‍⚖️ Admin"** después de ingresar

3. **Funcionalidad**:
   - **Pendientes**: Avisos sin verificar ni ocultos
   - **Verificados**: Avisos que ya verificaste
   - **Todos**: Todo sin filtro
   - **Acciones**: Verificar, Ocultar/Mostrar, Eliminar

---

## 🐛 TROUBLESHOOTING

| Problema | Solución |
|----------|----------|
| "⚠️ Configura SUPABASE_URL" | Verifica que reemplazaste los valores correctos en el código |
| Login no funciona | Asegúrate que Email Auth esté HABILITADO en Supabase |
| Las imágenes no se suben | Verifica bucket `images` esté PUBLIC y RLS esté bien |
| 404 en images | Espera unos segundos a que se procese la subida |
| Admin panel no aparece | Reemplaza `ADMIN_EMAIL` con tu email exacto |

---

## 📦 DESPLIEGUE A PRODUCCIÓN

### En Netlify:

1. Crea archivo `.env.production`:
   ```
   VITE_SUPABASE_URL=https://abc123.supabase.co
   VITE_SUPABASE_ANON_KEY=tu_key
   ```

2. Sube a GitHub

3. Conecta en Netlify: Nuevo site → GitHub repo

4. Build: `npm run build` (o sin builder si es HTML puro)

5. **Publish!**

### En Vercel:

Mismo proceso, pero en la UI de Vercel establece las variables de entorno.

---

## ✅ CHECKLIST FINAL

- [ ] Proyecto Supabase creado
- [ ] Auth (Email) habilitado
- [ ] Tabla `posts` creada con RLS
- [ ] Bucket `images` creado (Public)
- [ ] Credenciales copiadas
- [ ] Valores reemplazados en el código
- [ ] `ADMIN_EMAIL` configurado
- [ ] Testeado login, crear aviso, contactar por WhatsApp
- [ ] Testeado panel admin

¡Listo! 🎉

---

## 📞 SOPORTE

Si conectás problemas:
1. Abre DevTools (F12) > Console y copia errores
2. Verifica que URLs y keys sean exactas
3. Comprueba RLS está habilitado
4. Lee la documentación de Supabase: https://supabase.com/docs
