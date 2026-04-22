# 🔒 Sistema de Análisis de Imágenes - Protección de Privacidad

## Descripción General
Sistema de dos capas para proteger la privacidad de personas en imágenes:
1. **Cliente**: Detección de rostros con face-api.js antes de subir
2. **Servidor**: Análisis con Google Vision API tras subir la imagen

---

## 🛡️ Configuración - Capa de Cliente

### Face-api.js
La librería `face-api.js` detecta rostros **antes** de que el usuario suba la imagen.

**Ventajas:**
- Validación instantánea (sin esperar servidor)
- Protege privacidad desde el inicio
- Mejor UX (feedback inmediato)

**Ubicación del código:**
- [src/components/UploadForm.jsx](src/components/UploadForm.jsx#L109-L153) - Detección en `handleSubmit()`

**Flujo:**
```
Usuario selecciona imagen
    ↓
handleFileChange(): Validar tipo, tamaño, formato
    ↓
handleSubmit(): face-api.js detecta rostros
    ↓
¿Rostro detectado?
  SÍ → ⛔ Bloquear y mostrar alerta
  NO → ✅ Proceder a crear post
```

---

## 🌐 Configuración - Capa de Servidor

### Google Vision API
Análisis adicional **después** de subir, para detectar:
- ✅ Rostros (detectionConfidence > 30%)
- ✅ Contenido inapropiado (adulto, violencia)

**Archivo:** [supabase/functions/analyze-image/index.ts](supabase/functions/analyze-image/index.ts)

### Pasos de Configuración

#### 1. Crear Proyecto en Google Cloud
```bash
# En https://console.cloud.google.com/
1. Crear nuevo proyecto
2. Habilitar "Vision API"
3. Crear credencial (API Key)
```

#### 2. Configurar Variables de Entorno en Supabase
```bash
supabase secrets set GOOGLE_VISION_API_KEY=<TU_API_KEY>
```

#### 3. Configurar Storage Trigger
En Supabase Dashboard → Storage → posts:
```
Event: s3:ObjectCreated:*
Function: analyze-image
```

O ejecutar en terminal:
```bash
supabase functions deploy analyze-image
```

---

## 📊 Flujo Completo de Análisis

```
1. Usuario sube imagen con UploadForm
   ↓
2. face-api.js valida en cliente
   - Si hay rostro → Bloquear con alerta
   - Sin rostro → Continuar
   ↓
3. Imagen se sube a Storage (posts/)
   ↓
4. Trigger automático → analyze-image()
   ↓
5. Google Vision API analiza
   - Detecta rostros (confidence > 30%)
   - Valida contenido (safe search)
   ↓
6. ¿Imagen rechazada?
   - SÍ → Eliminar archivo + post
   - NO → Mantener (aprobada)
   ↓
7. Post disponible en feed (si aprobado)
```

---

## 🚨 Mensajes de Error

### Cliente (face-api.js)
```
⚠️ PRIVACIDAD PROTEGIDA

No se permiten imágenes que contengan rostros de personas. 
Esto es para proteger la privacidad y la seguridad de todos.

Si tu imagen contiene un rostro, por favor selecciona otra 
sin personas visibles.
```

### Servidor (Google Vision)
```
Status: rejected
Reason: Face detected
Message: ⚠️ Imagen rechazada: Contiene rostros de personas. 
         Por tu privacidad y la de otros, no se permiten estas imágenes.
```

O:
```
Status: rejected
Reason: Inappropriate content
Message: ⚠️ Imagen rechazada: Contiene contenido inapropiado.
```

---

## 🧪 Testing

### Probar Detección de Rostros
```bash
# 1. Subir imagen CON rostro
npm run dev
# → Debería bloquearse en cliente con face-api.js

# 2. Verificar logs
# → Browser: F12 → Console
# → Supabase: Dashboard → Edge Functions → Logs
```

### Imágenes de Prueba
- **Con rostro:** [Unsplash Portrait](https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d)
- **Sin rostro:** [Unsplash Landscape](https://images.unsplash.com/photo-1506905925346-21bda4d32df4)

---

## 🔍 Monitoreo

### Ver Logs
```bash
# Supabase Dashboard
Proyecto → Functions → analyze-image → Logs
```

### Ejemplo de Log Exitoso
```
🔍 Analizando imagen para postId: 123, fileName: 1705362815.jpeg
📸 Imagen URL: https://...
👤 Caras detectadas: 0
✅ Imagen aprobada
```

### Ejemplo de Log Rechazado
```
🔍 Analizando imagen para postId: 124, fileName: 1705362890.jpeg
👤 Caras detectadas: 1
⚠️ Caras detectadas con confianza > 30%: 1
✅ Archivo eliminado de storage
✅ Post eliminado de base de datos
```

---

## 🎯 Validaciones Implementadas

### Cliente (UploadForm.jsx)
- ✅ Tipo de archivo (JPEG, PNG, WebP, GIF)
- ✅ Tamaño máximo (5MB)
- ✅ Detección de rostros (face-api.js)

### Servidor (analyze-image/index.ts)
- ✅ Detección de rostros (confidence > 30%)
- ✅ Detección de contenido adulto
- ✅ Detección de violencia
- ✅ Manejo de errores robusto
- ✅ Logging detallado

---

## 📱 Casos de Uso Permitidos

✅ **Ofertas y Precios**
- Productos sin personas
- Menúes de restaurantes
- Publicidad de servicios

✅ **Alertas de Seguridad**
- Vehículos implicados en accidentes
- Objetos robados
- Lugares dañados

✅ **Servicios/Changas**
- Herramientas
- Productos ofertados
- Trabajos realizados (sin personas)

---

## 📱 Casos de Uso Prohibidos

❌ **Contenido con Personas**
- Selfies
- Fotos de grupo
- Capturas de video con gente
- Vigilancia o retratos de vecinos

❌ **Contenido Inapropiado**
- Contenido adulto
- Violencia o gore
- Acoso o difamación

---

## 🔧 Troubleshooting

### "Error: GOOGLE_VISION_API_KEY no configurada"
```bash
1. Verificar en Supabase Dashboard → Settings → Edge Functions Secrets
2. Ejecutar: supabase secrets set GOOGLE_VISION_API_KEY=<KEY>
3. Redeploy: supabase functions deploy analyze-image
```

### Face-api.js no detecta rostros
```bash
# Verificar en DevTools Console:
window.faceapi  // Debe existir
window.faceApiReady  // Debe ser true
```

### Imagen bloqueada sin razón
```bash
# Verificar logs:
supabase functions logs analyze-image
# Si confidence < 30%, puede ser falso positivo
```

---

## 🚀 Próximas Mejoras

- [ ] Blur automático de rostros (en lugar de rechazar)
- [ ] Análisis de OCR para detectar texto sensible
- [ ] Reportes de privacidad por usuario
- [ ] Dashboard de moderación
- [ ] Cache de resultados para optimizar

---

## 📚 Referencias

- [Google Vision API - Face Detection](https://cloud.google.com/vision/docs/detecting-faces)
- [face-api.js GitHub](https://github.com/justadudewhohacks/face-api.js)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
