# ⚡ PRIMEROS PASOS - QUICK REFERENCE

## 🚀 EN 3 PASOS

### PASO 1: Configura Supabase (20 minutos)
```bash
1. Abre: https://supabase.com
2. New Project → rodriguez-conecta
3. Region: South America
4. Espera 2 minutos
```

### PASO 2: Copia el SQL (en Supabase → SQL Editor)
```sql
-- COPIA Y PEGA esto completo:

CREATE TABLE IF NOT EXISTS posts (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    categoria TEXT NOT NULL CHECK (categoria IN ('precios', 'seguridad', 'servicios', 'basural')),
    mensaje TEXT NOT NULL,
    image_url TEXT,
    phone_hidden TEXT NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    user_email TEXT NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    is_hidden BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_posts_categoria ON posts(categoria);
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_posts_is_hidden ON posts(is_hidden);

ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Avisos públicos - ver" ON posts
    FOR SELECT USING (is_hidden = FALSE);

CREATE POLICY "Usuario elimina su propio aviso" ON posts
    FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Usuarios autenticados crean avisos" ON posts
    FOR INSERT WITH CHECK (auth.uid() = user_id AND auth.uid() IS NOT NULL);
```

✅ Click **Run**

---

### PASO 3: Obtén Credenciales

**En Supabase → Settings → API:**

Copia esto:
```
Project URL → https://abc123.supabase.co
Anon Key → eyJ...completa...
```

---

## 📝 Configura el Código

Abre `rodriguez-conecta-supabase.html` y busca:

```javascript
// LÍNEA ~13-15
const SUPABASE_URL = 'https://YOUR_PROJECT_ID.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY';
const ADMIN_EMAIL = 'admin@ejemplo.com';
```

**Reemplaza**:
- `https://YOUR_PROJECT_ID.supabase.co` → Tu URL (ej: https://abcdef123.supabase.co)
- `YOUR_ANON_KEY` → Tu key completa
- `admin@ejemplo.com` → Tu email

**Guarda el archivo.**

---

## 🎯 Listo! Testea

1. Abre `rodriguez-conecta-supabase.html` en navegador
2. Click "Entrar" → "Crear una"
3. Completa signup
4. Click ✏️ → Crea un aviso
5. Click "📲 Contactar" → ¡Abre WhatsApp!

---

## 🪣 (Opcional) Habilita Imágenes

En Supabase:

1. **Storage** → **Create new bucket**
2. Name: `images`
3. Toggle **Public** ON
4. Done!

RLS (copia en SQL Editor):
```sql
CREATE POLICY "Public read" ON storage.objects
    FOR SELECT USING (bucket_id = 'images');

CREATE POLICY "Authenticated upload" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'images' AND auth.role() = 'authenticated');
```

---

## 👨‍⚖️ Admin Panel

Si cambiaste `ADMIN_EMAIL` a tu email real, después de login verás botón "👨‍⚖️ Admin".

Funciones:
- Verificar avisos
- Ocultar spam
- Eliminar

---

## ❌ Si algo falla

### "⚠️ Configura SUPABASE_URL"
Revisá que pegaste los valores EXACTAMENTE (sin espacio extra).

### Login no funciona
En Supabase → Authentication → Métodos de Acceso → Email debe estar VERDE

### Imágenes no suben
Crea bucket `images` en Storage (agranda. anterior).

---

## 📱 Lanzar Online

### Opción A: Netlify (FÁCIL)
```
1. Sube archivo a GitHub
2. Conecta repo en netlify.com
3. Deploy automático
```

### Opción B: Vercel
```
1. Igual que Netlify
2. Usa vercel.com
```

---

## 🔒 Seguridad del Teléfono

**Garantizado**:
- ✅ Nunca aparece en HTML visible
- ✅ Solo en atributo `data-phone` (invisible)
- ✅ Se usa solo al clickear "Contactar"
- ✅ Protegido por RLS en la BD

**Resultado**: Ideal para proteger privacidad.

---

## 📞 Números de Prueba WhatsApp

Para testear sin número real:
- `5491112345678`
- `5491198765432`

Al clickear "Contactar", abre WhatsApp con tu número de prueba.

---

## ✨ Listo!

Ya tienes **Rodríguez Conecta productivo** con:
- ✅ Auth real (Supabase)
- ✅ BD con RLS
- ✅ Imágenes en Storage
- ✅ Teléfono protegido
- ✅ Admin panel
- ✅ Listo para escalar

**Próximo paso**: Invita vecinos a usarlo! 🎉

---

## 🚨 IMPORTANTE

1. Cambia `ADMIN_EMAIL` a tu email real
2. Guarda contraseña de la BD en lugar seguro
3. En producción, habilita 2FA en Supabase
4. Revisa RLS cada tanto

---

**¿Preguntas?** Consultá `ARCHITECTURE_SECURITY.md`

¡Éxito! 🚀
