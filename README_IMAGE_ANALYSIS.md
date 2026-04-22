# 🔒 Sistema de Protección de Privacidad - Análisis de Imágenes

## 🎯 Objetivo

Garantizar que **las imágenes subidas a "yo te avisé" no contengan rostros de personas**, protegiendo la privacidad de todos los usuarios.

---

## ✨ Características Implementadas

### 1. **Detección de Rostros en Cliente** (face-api.js)

- ✅ Valida imágenes **antes** de subir al servidor
- ✅ Feedback instantáneo al usuario
- ✅ Sin consumir recursos de servidor
- ✅ Funciona offline

**Ubicación:** [index.html](index.html#L27-L46) - Cargando face-api.js

### 2. **Análisis en Servidor** (Google Vision API)

- ✅ Segunda capa de seguridad
- ✅ Detecta rostros con confianza > 30%
- ✅ Detecta contenido inapropiado
- ✅ Elimina automáticamente imágenes rechazadas

**Ubicación:** [supabase/functions/analyze-image/index.ts](supabase/functions/analyze-image/index.ts)

### 3. **Validaciones de Archivo**

- ✅ Tipo de archivo (JPEG, PNG, WebP, GIF)
- ✅ Tamaño máximo (5MB)
- ✅ Manejo de errores robusto

**Ubicación:** [src/components/UploadForm.jsx](src/components/UploadForm.jsx#L79-L104)

---

## 🚀 Cómo Activar (Setup)

### Opción 1: Setup Automático (Linux/Mac)

```bash
chmod +x setup-image-analysis.sh
./setup-image-analysis.sh
```

### Opción 2: Setup Automático (Windows)

```powershell
powershell -ExecutionPolicy Bypass -File setup-image-analysis.ps1
```

### Opción 3: Setup Manual

1. **Crear API Key en Google Cloud:**
   - Ir a https://console.cloud.google.com/
   - Crear proyecto
   - Habilitar "Vision API"
   - Crear credencial (API Key)

2. **Configurar en Supabase:**

   ```bash
   supabase secrets set GOOGLE_VISION_API_KEY=<TU_API_KEY>
   ```

3. **Desplegar función:**

   ```bash
   supabase functions deploy analyze-image
   ```

4. **Configurar trigger en Storage:**
   - Dashboard Supabase → Storage → posts
   - Create New Trigger
   - Event: `s3:ObjectCreated:*`
   - Function: `analyze-image`

---

## 📊 Flujo de Funcionamiento

```
Usuario abre UploadForm
    ↓
Selecciona imagen
    ↓
handleFileChange() valida tipo/tamaño
    ↓
Usuario hace click "Publicar"
    ↓
handleSubmit():
  - Valida datos del formulario
  - face-api.js detecta rostros
    - SÍ → ❌ Bloquear con alerta
    - NO → ✅ Proceder
    ↓
Sube imagen a Storage (posts/)
    ↓
Trigger automático → analyze-image()
    ↓
Google Vision API analiza
    ↓
¿Rostro detectado O contenido inapropiado?
  - SÍ → Eliminar archivo + post
  - NO → Mantener (aprobado)
    ↓
Post disponible en feed
```

---

## 🧪 Testing

### Prueba Rápida

```bash
npm run dev
```

Luego:

1. Abre la app en http://localhost:5173
2. Toca botón "+" para crear post
3. Selecciona categoría → ubicación → detalles
4. Sube imagen **CON rostro**
5. Debería aparecer alerta: "PRIVACIDAD PROTEGIDA"

### Imágenes de Prueba

- **Con rostro:** [Unsplash Portrait](https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400)
- **Sin rostro:** [Unsplash Landscape](https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400)

### Ver Logs

```bash
# Cliente
DevTools → Console (F12)
# Ejemplo:
✅ Face API inicializado correctamente
🔍 Iniciando detección de rostros...
✅ Imagen cargada: 1920x1080px
👁️ Analizando rostros...
❌ Publicación bloqueada: se detectaron rostros

# Servidor
supabase functions list
supabase functions logs analyze-image
# Ejemplo:
🔍 Analizando imagen para postId: 123, fileName: 1705362815.jpeg
👤 Caras detectadas: 1
⚠️ Caras detectadas con confianza > 30%: 1
✅ Archivo eliminado de storage
✅ Post eliminado de base de datos
```

---

## 📁 Archivos Clave

| Archivo                                                                                | Descripción                            |
| -------------------------------------------------------------------------------------- | -------------------------------------- |
| [index.html](index.html#L27-L46)                                                       | Carga face-api.js                      |
| [src/components/UploadForm.jsx](src/components/UploadForm.jsx)                         | Interfaz de upload + detección cliente |
| [src/context/AppContext.jsx](src/context/AppContext.jsx#L140-L195)                     | Lógica de creación de posts            |
| [supabase/functions/analyze-image/index.ts](supabase/functions/analyze-image/index.ts) | Análisis en servidor                   |
| [SETUP_IMAGE_ANALYSIS.md](SETUP_IMAGE_ANALYSIS.md)                                     | Documentación detallada                |

---

## 🛠️ Configuración Avanzada

### Cambiar Umbral de Confianza de Rostro

En [supabase/functions/analyze-image/index.ts](supabase/functions/analyze-image/index.ts):

```typescript
// Línea ~100
const facesWithConfidence = faceAnnotations.filter((face) => {
  const confidence = face.detectionConfidence || face.confidence || 0;
  return confidence > 0.3; // ← Cambiar 0.3 a otro valor (0.0 - 1.0)
});
```

### Cambiar Tamaño Máximo de Imagen

En [src/components/UploadForm.jsx](src/components/UploadForm.jsx#L82-L85):

```jsx
// Línea ~82
const maxSize = 5 * 1024 * 1024; // ← Cambiar 5MB a otro valor
```

---

## 📚 Documentación Completa

Ver [SETUP_IMAGE_ANALYSIS.md](SETUP_IMAGE_ANALYSIS.md) para:

- Pasos detallados de configuración
- Troubleshooting
- Casos de uso permitidos/prohibidos
- Monitoreo y logs
- Próximas mejoras

---

## ✅ Checklist de Implementación

- [ ] Google Vision API configurada
- [ ] GOOGLE_VISION_API_KEY en Supabase secrets
- [ ] Función `analyze-image` desplegada
- [ ] Storage trigger configurado para posts/
- [ ] Face API cargado en index.html
- [ ] npm run dev funciona sin errores
- [ ] Probado con imagen que tiene rostro → bloqueado
- [ ] Probado con imagen sin rostro → publicado

---

## 🎓 Cómo Funciona Técnicamente

### Cliente (face-api.js)

```javascript
// El usuario sube imagen
const detections = await window.faceapi.detectAllFaces(
  canvas,
  new window.faceapi.TinyFaceDetectorOptions(),
);

// Si hay rostros → no publicar
if (detections.length > 0) {
  alert("⚠️ No se permiten rostros");
  return;
}
```

### Servidor (Google Vision)

```typescript
// Storage trigger → función automática
const response = await fetch(
  "https://vision.googleapis.com/v1/images:annotate",
  {
    method: "POST",
    body: JSON.stringify({
      requests: [
        {
          image: { source: { imageUri: imageUrl } },
          features: [
            { type: "FACE_DETECTION" },
            { type: "SAFE_SEARCH_DETECTION" },
          ],
        },
      ],
    }),
  },
);

// Si hay rostros o contenido inapropiado → eliminar
if (result.faceAnnotations.length > 0 || inappropriate) {
  await deleteImage();
  await deletePost();
}
```

---

## 🔐 Seguridad

✅ **Dos capas de protección:**

1. Cliente (instant feedback, UX)
2. Servidor (si alguien hackea cliente)

✅ **Automático:** Elimina sin intervención manual

✅ **Sin falsos positivos críticos:** Umbral 30% confianza

✅ **Logs detallados:** Para monitoreo y debugging

---

## 🚨 Troubleshooting Rápido

| Problema                               | Solución                                          |
| -------------------------------------- | ------------------------------------------------- |
| `faceapi is not defined`               | Ver en DevTools si face-api.js se cargó           |
| `GOOGLE_VISION_API_KEY not configured` | `supabase secrets set GOOGLE_VISION_API_KEY=...`  |
| Función no se ejecuta                  | Verificar Storage trigger en Dashboard            |
| Imagen grande no se sube               | Máximo 5MB, ver UploadForm.jsx                    |
| Rostro no detectado                    | Puede ser falso negativo, servidor valida también |

---

## 📞 Soporte

- Revisa [SETUP_IMAGE_ANALYSIS.md](SETUP_IMAGE_ANALYSIS.md) para troubleshooting
- Verifica logs: `supabase functions logs analyze-image`
- Revisa console del navegador: F12 → Console

---

## 🎉 ¡Listo!

El sistema de protección de privacidad está implementado. Cada imagen será validada automáticamente para garantizar que no contiene rostros de personas.

**Privacidad protegida 🔒**
