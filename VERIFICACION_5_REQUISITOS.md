# ✅ VERIFICACIÓN - 5 REQUISITOS

Usa esta checklist para verificar que cada requisito funciona correctamente.

---

## ✅ REQUISITO 1: TELÉFONO OCULTO

### Test 1.1: Teléfono NO en HTML
```
1. Abrir app en navegador
2. Presionar F12 (DevTools)
3. Ir a tab "Elements"
4. Presionar Ctrl+F (Find in HTML)
5. Buscar: "54" o "5491" o cualquier dígito de teléfono de prueba
6. RESULTADO ESPERADO: No encontrar números en el HTML
```

### Test 1.2: WhatsApp Funciona
```
1. Crear post con teléfono: +54 9 1234567890
2. En feed, hacer clic en botón "💬 Contactar"
3. RESULTADO ESPERADO: 
   - Se abre nueva ventana WhatsApp
   - URL contiene: https://wa.me/549...
   - Si WhatsApp no instalado, ir a web.whatsapp.com
```

### Test 1.3: Teléfono en Memoria (Developer)
```javascript
// En DevTools → Console, escribir:
allPosts[0].phone

// RESULTADO ESPERADO:
// "+54 9 1234567890" (teléfono visible en JS)

// Pero NO está en:
document.body.innerHTML.includes("1234567890") // false
```

---

## ✅ REQUISITO 2: AUTENTICACIÓN CLERK

### Test 2.1: Modal de Login Aparece
```
1. Abrir app
2. RESULTADO ESPERADO:
   - Modal Clerk visible (no feed)
   - Input de email
   - Input de password
   - Botones: "Sign In" y "Sign Up"
```

### Test 2.2: Crear Cuenta Funciona
```
1. Hacer clic "Sign Up"
2. Ingresar email: test@example.com
3. Ingresar password: Test123!
4. Clic "Sign Up"
5. RESULTADO ESPERADO:
   - Verified by email (o skip si es sandbox)
   - Feed ahora visible
   - Header muestra nombre/email
```

### Test 2.3: Login Funciona
```
1. Hacer clic "Sign In"
2. Ingresar email y password
3. RESULTADO ESPERADO:
   - Feed carga
   - Header muestra usuario
   - Botón FAB visible (crear post)
```

### Test 2.4: JWT Enviado (Developer)
```
1. Abrir DevTools → Network
2. Crear nuevo post
3. Buscar request a /api/db
4. Click en request
5. Ir a tab "Headers"
6. RESULTADO ESPERADO:
   - Header "Authorization: Bearer eyJhbGc..."
   - Token no vacío
```

---

## ✅ REQUISITO 3: FOTOS IMGBB

### Test 3.1: Upload Form Aparece
```
1. Hacer clic en botón FAB (➕)
2. RESULTADO ESPERADO:
   - Modal "Nuevo Aviso" abierto
   - Input "📷 Foto (opcional)"
   - Texto "Max 5MB"
```

### Test 3.2: Upload Funciona
```
1. Seleccionar imagen < 5MB
2. Barra de progreso: 0% → 100%
3. Texto: "✅ Imagen lista para publicar"
4. Hacer clic "📤 Publicar Aviso"
5. RESULTADO ESPERADO:
   - Post aparece en feed
   - Imagen visible bajo el mensaje
   - Clic en imagen lo abre en nueva tab
```

### Test 3.3: Validación Tamaño
```
1. Intentar subir imagen > 5MB
2. RESULTADO ESPERADO:
   - Alert: "La imagen es muy grande"
   - Post NO se publica
```

### Test 3.4: Validación Formato
```
1. Intentar subir archivo .pdf o .txt
2. Input tipo "file" accept="image/*"
3. RESULTADO ESPERADO:
   - Selector de archivos solo muestra imágenes
   - Otros tipos bloqueados
```

---

## ✅ REQUISITO 4: ELIMINAR PROPIOS

### Test 4.1: Botón Eliminar Aparece en Propios
```
1. Crear post: "Prueba de eliminación"
2. En feed, buscar ese post
3. RESULTADO ESPERADO:
   - Botón "🗑️ Eliminar" visible
   - Solo en TUS posts
```

### Test 4.2: Botón Eliminar NO Aparece en Ajenos
```
1. Conectarse con otro usuario (otra pestaña incógnito)
2. Ver posts de primer usuario
3. RESULTADO ESPERADO:
   - Botón "🗑️ Eliminar" NO visible
   - Solo botón "💬 Contactar"
```

### Test 4.3: Eliminar Funciona
```
1. Hacer clic "🗑️ Eliminar"
2. Confirmar en modal
3. RESULTADO ESPERADO:
   - Post desaparece del feed
   - En DB: registrado como deleted
   - Otros usuarios: post no visible
```

### Test 4.4: Ownership Validación (Developer)
```
1. Intentar trucar código:
   await callApi('DELETE_POST', { post_id: 5 });
   (5 = post de otro usuario)

2. RESULTADO ESPERADO:
   - Error 403 "No tienes permiso"
   - Post NO se elimina
```

---

## ✅ REQUISITO 5: PANEL ADMIN

### Test 5.1: Botón Admin NO Aparece para No-Admin
```
1. Login con email: user@example.com
2. RESULTADO ESPERADO:
   - Header: NO aparece botón "🛡️ Admin"
   - Solo botón "Salir"
```

### Test 5.2: Botón Admin Aparece para Admin
```
1. Cambiar VITE_ADMIN_EMAIL en .env.local
2. VITE_ADMIN_EMAIL=admin@test.com

3. Login con email: admin@test.com
4. RESULTADO ESPERADO:
   - Header: botón "🛡️ Admin" visible
```

### Test 5.3: Panel Admin Abre
```
1. Hacer clic "🛡️ Admin"
2. RESULTADO ESPERADO:
   - "Panel de Administración" visible
   - Tabla con columnas: Usuario, Categoría, Mensaje, Estado, Acciones
   - Todos los posts listados (incluso ocultos)
```

### Test 5.4: Botón "Verificar" Funciona
```
1. En tabla admin, buscar post sin "✓ Verificado"
2. Hacer clic "Verificar"
3. RESULTADO ESPERADO:
   - Post ahora muestra "✓ Verificado" badge
   - Tabla se recarga
   - En feed: badge visible
```

### Test 5.5: Botón "Ocultar" Funciona
```
1. Hacer clic "Ocultar" en un post visible
2. RESULTADO ESPERADO:
   - Tabla muestra "OCULTO" badge rojo
   - En feed público: post desaparece
```

### Test 5.6: Botón "Eliminar" Admin
```
1. Hacer clic "Eliminar"
2. Confirmar
3. RESULTADO ESPERADO:
   - Post se elimina de tabla
   - Post se elimina de feed
   - Otros usuarios: post no visible
```

---

## 🔐 SEGURIDAD - TEST ADICIONALES

### Test Seg 1: Teléfono NO en Response
```
1. DevTools → Network
2. Crear post
3. Request a /api/db → POST
4. Response JSON
5. RESULTADO ESPERADO:
   - Response NO contiene "phone"
   - Response contiene: id, message, category, image_url, etc
```

### Test Seg 2: SQL Injection Bloqueado
```
1. En "Mensaje", ingresar:
   ' OR '1'='1

2. Publicar post
3. RESULTADO ESPERADO:
   - Mensaje se guarda como texto
   - NO ejecuta SQL
   - Se almacena: "' OR '1'='1"
```

### Test Seg 3: XSS Bloqueado
```
1. En "Mensaje", ingresar:
   <img src=x onerror="alert('XSS')">

2. Publicar
3. Ver en feed
4. RESULTADO ESPERADO:
   - NO hay popup alert
   - Se muestra como texto: "<img src=x..."
   - Escapeado por el backend
```

### Test Seg 4: Ownership Validación (SQL)
```
1. Conectar como Usuario A
2. Crear post (id=100)
3. Copiar postId=100

4. Cambiar a Usuario B
5. Ejecutar en console:
   await callApi('DELETE_POST', { post_id: 100 });

6. RESULTADO ESPERADO:
   - Error 403
   - Post de Usuario A sigue intacto
```

### Test Seg 5: Admin No puede Ser Suplantado
```
1. Cambiar en DevTools el JWT (modificar payload)
2. Intentar usar admin endpoints
3. RESULTADO ESPERADO:
   - Error 401 "Invalid JWT"
   - Backend rechaza token modificado
```

---

## 📋 TESTING CHECKLIST COMPLETO

### Frontend ✅
- [ ] Clerk modal carga
- [ ] Login funciona
- [ ] Signup funciona
- [ ] Feed carga posts
- [ ] Filtros funcionan
- [ ] FAB button abre modal
- [ ] Form submit valida
- [ ] Imagen sube a ImgBB
- [ ] Botón contactar abre WhatsApp
- [ ] Teléfono NO en HTML

### Backend ✅
- [ ] /api/db responde
- [ ] JWT verification funciona
- [ ] Ownership validation funciona
- [ ] Admin check funciona
- [ ] Errores con status correcto
- [ ] Response JSON válido

### Database ✅
- [ ] Tabla posts existe
- [ ] Índices creados
- [ ] Triggers funcionan (updated_at)
- [ ] Datos persisten

### Admin ✅
- [ ] Botón admin aparece si email correcto
- [ ] Panel admin carga
- [ ] Tabla muestra todos posts
- [ ] Botón "Verificar" funciona
- [ ] Botón "Ocultar" funciona
- [ ] Botón "Eliminar" funciona

### Seguridad ✅
- [ ] Teléfono oculto
- [ ] JWT validado
- [ ] Ownership protected
- [ ] SQL injection blocked
- [ ] XSS blocked
- [ ] Admin whitelist funciona

---

## 🎯 CONCLUSIÓN

✅ Si TODOS los tests pasan → App lista para producción

### Resultado Esperado
- Aplicación funcional 100%
- 5 requisitos implementados
- 4 capas de seguridad activas
- Lista para usuarios reales
- Código limpio y documentado

**¡Conecta con tus vecinos!** 🏘️
