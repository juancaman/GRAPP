# 🏗️ ARQUITECTURA Y SEGURIDAD

## 🎯 FLUJO DE DATOS

```
┌─────────────────────────────────────────────────────────────────┐
│                    NAVEGADOR (HTML + JS)                        │
├─────────────────────────────────────────────────────────────────┤
│ 1. Usuario ingresa email/password                               │
│ 2. Supabase Auth valida credenciales                            │
│ 3. Se guarda sesión en localStorage                             │
│ 4. Usuario privado ← NO se renderiza nunca en el DOM ✅         │
└──────────────────────────────────────────────────────────────────┘
                              ↓
                     (Supabase SDK)
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│                    SUPABASE BACKEND                              │
├──────────────────────────────────────────────────────────────────┤
│ • Autenticación (JWT)                                            │
│ • PostgreSQL con RLS (Row Level Security)                        │
│ • Storage bucket para imágenes                                   │
│ • Verificación de rol/email para admin                           │
└──────────────────────────────────────────────────────────────────┘
```

---

## 🔐 SEGURIDAD: TELÉFONO OCULTO

### ¿Cómo se protege el número de WhatsApp?

#### 1. En la Base de Datos
```sql
-- Tabla posts
┌─────────────────────────────────────────┐
│ id  │ categoria │ mensaje │ phone_hidden │
├─────────────────────────────────────────┤
│ 42  │ precios   │ "Pizza" │ "5491123456" │
└─────────────────────────────────────────┘

-- El teléfono se almacena LIMPIO (solo dígitos)
-- NO se encripta en DB (podría hacerse con pgcrypto si quieres extra)
```

#### 2. En el HTML (NUNCA se renderiza)
```javascript
// ❌ MAL - Esto NO hacemos
<div>📲 +54 9 11 1234-5678</div>

// ✅ BIEN - Lo que hacemos
<button class="whatsapp-btn" data-phone="5491112345678">
    📲 Contactar
</button>
// El número está en atributo, NO visible en la página
```

#### 3. Al hacer Click
```javascript
// El JS extrae el número solo cuando el usuario clickea
btn.addEventListener('click', (e) => {
    const phoneNumber = btn.dataset.phone; // Se lee del atributo
    const message = encodeURIComponent('Hola...');
    window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
    // Se abre WhatsApp en nueva pestaña
});
```

#### 4. RLS (Row Level Security)
```sql
-- Políticas de Supabase
-- 1. Cualquiera ve avisos públicos (no ocultos)
CREATE POLICY "Avisos públicos - ver" ON posts
    FOR SELECT USING (is_hidden = FALSE);

-- 2. Solo el dueño puede eliminar su aviso
CREATE POLICY "Usuario elimina su propio aviso" ON posts
    FOR DELETE USING (auth.uid() = user_id);

-- 3. Solo autenticados pueden crear
CREATE POLICY "Usuarios autenticados crean avisos" ON posts
    FOR INSERT WITH CHECK (auth.uid() = user_id);
```

**Resultado**: El teléfono NUNCA se expone a:
- Scraping web (no está en HTML)
- Ataques CSRF (API está protegida por JWT)
- Usuarios no autenticados (pueden VER avisos, pero no editar)
- Admin malicioso (solo ve si pagina el aviso manualmente)

---

## 👨‍⚖️ MODERACIÓN (Admin Panel)

### Acceso
```javascript
// Solo si tu email = ADMIN_EMAIL configurado
if (currentUser.email === 'admin@ejemplo.com') {
    adminBtn.style.display = 'block';
}
```

### Vistas del Admin
1. **Pendientes**: Avisos sin verificar que siguen visibles
2. **Verificados**: Avisos que pasaron moderación
3. **Todos**: Todo sin filtro

### Acciones del Admin
```
┌─────────────────────────────────────────┐
│ Avatar │ Mensaje │ Estado │ Acciones   │
├─────────────────────────────────────────┤
│ user@  │ "Pizza" │ ⏳ Pend.│ Verificar  │
│        │         │        │ Ocultar    │
│        │         │        │ 🗑️ Eliminar│
└─────────────────────────────────────────┘
```

- **Verificar**: Marca como `is_verified = true` (badgeado ✅)
- **Ocultar**: Pone `is_hidden = true` (no aparece en feed)
- **Eliminar**: Borra el registro

**Nota**: El admin NUNCA ve el teléfono directo, solo el email del usuario.

---

## 🖼️ IMÁGENES (Storage)

### Flujo de subida
```
1. Usuario selecciona imagen en el form
2. JS previsualiza localmente (FileReader)
3. Al publicar, se sube a Supabase Storage
4. Se guarda URL pública en la BD
5. En el feed, se renderiza <img src="URL">
```

### Política de Acceso
```sql
-- Lectura: Público (cualquiera ve las imágenes)
CREATE POLICY "Public read images" ON storage.objects
    FOR SELECT USING (bucket_id = 'images');

-- Escritura: Solo autenticados
CREATE POLICY "Authenticated upload" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'images' AND auth.role() = 'authenticated');

-- Eliminación: Solo dueño
CREATE POLICY "Owner delete" ON storage.objects
    FOR DELETE USING (bucket_id = 'images' AND auth.uid() = owner);
```

### Fallback si falla la imagen
```html
<img src="..." onerror="this.style.display='none'">
```
Si la URL expira o falla, simplemente no se muestra (el aviso sigue visible).

---

## 🔑 TOKENS Y SESIONES

### Flujo de Auth
```
1. Usuario: email + password
   ↓
2. Supabase Auth valida
   ↓
3. Si OK: Devuelve JWT (token)
   ↓
4. JS guarda sesión en localStorage
   ↓
5. Cada request incluye JWT (automático con SDK)
```

### Seguridad de JWT
- **Firmado**: Supabase lo firma con su clave privada
- **Expiración**: ~3600 segundos (1 hora)
- **Refresh**: Se renueva automáticamente
- **Scope**: Anon key solo permite SELECT público + INSERT propios

---

## 🛡️ VERIFICACIÓN DE ESTADO

### Tabla de Permisos

| Acción | Usuario Normal | Dueño del Aviso | Admin | No Autenticado |
|--------|---|---|---|---|
| Ver avisos públicos | ✅ | ✅ | ✅ | ✅ |
| Ver teléfono directo | ❌ | ✅ | ❌ | ❌ |
| Contactar por WA | ✅ | ✅ | ✅ | ✅ |
| Crear aviso | ✅ | ✅ | ✅ | ❌ |
| Eliminar propio | ✅ | ✅ | ✅ | N/A |
| Eliminar ajeno | ❌ | ❌ | ✅ | N/A |
| Verificar aviso | ❌ | ❌ | ✅ | N/A |
| Ocultar aviso | ❌ | ❌ | ✅ | N/A |
| Acceso a admin | ❌ | ❌ | ✅ | ❌ |

---

## 📊 EVENTOS DE AUDITORÍA (Opcional)

Para auditar quién hace qué, podrías agregar triggers en Supabase:

```sql
-- Tabla de logs (crear aparte)
CREATE TABLE audit_log (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    action TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id),
    post_id BIGINT REFERENCES posts(id),
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger al eliminar aviso
CREATE TRIGGER audit_post_delete
AFTER DELETE ON posts
FOR EACH ROW
EXECUTE FUNCTION log_audit();
```

**Pero para un MVP no es necesario.**

---

## 🚀 ESCALAMIENTO

### Mejoras futuras
1. **Reputación**: Agregar campo `votes` / `likes`
2. **Comentarios**: Tabla separada con RLS
3. **Denuncias**: Permitir reportar avisos spam
4. **Búsqueda Full-Text**: Con `pg_trgm` en Supabase
5. **Localización**: Guardar lat/lng como antes
6. **Caché**: Redis en Supabase (Pro)

---

## ✅ CHECKLIST DE SEGURIDAD

- [ ] Teléfono no renderizado en HTML ✅
- [ ] Teléfono oculto en atributo `data-` ✅
- [ ] RLS habilitado en tabla `posts` ✅
- [ ] Solo dueño puede eliminar ✅
- [ ] Solo autenticados pueden crear ✅
- [ ] Admin verificado por email ✅
- [ ] Storage público pero sin edición ✅
- [ ] HTTPS en Vercel/Netlify ✅
- [ ] JWT expira automáticamente ✅
- [ ] Contraseñas nunca se guardan en JS ✅

---

## 📝 NOTAS FINALES

1. **Este MVP es SEGURO** para un pequeño barrio
2. Si crece mucho, considera:
   - Captcha en signup
   - Rate limiting
   - Encriptación de teléfono con pgcrypto
   - Webhook para logs

3. **Para producción**:
   - Cambiar `ADMIN_EMAIL` a tu email real
   - Habilitar 2FA en tu cuenta Supabase
   - Revisar políticas RLS periódicamente
   - Backups automáticos (Supabase lo hace)

¡Lista la app! 🎉
