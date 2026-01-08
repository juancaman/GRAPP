# Guías de Codificación AI para "yo te avisé"

## Resumen del Proyecto
"yo te avisé" es una app social de barrio para General Rodríguez, Argentina. Los usuarios publican ofertas locales, alertas de seguridad y servicios, con votación ("Me sirve") y publicaciones anónimas. Construida con React + Vite, backend Supabase y mapas Leaflet.

## Arquitectura
- **Frontend**: React con Context API para gestión de estado ([src/context/AppContext.jsx](src/context/AppContext.jsx))
- **Backend**: Supabase (Auth, Base de Datos, Storage, Realtime)
- **Base de Datos**: Tabla única `posts` con políticas RLS ([supabase_security.sql](supabase_security.sql))
- **Estilos**: Estilos inline con variables CSS, efectos glass-card ([src/styles/index.css](src/styles/index.css))

## Componentes Clave
- **App.jsx**: Layout principal con alternancia feed/mapa y botón FAB para subir
- **Feed.jsx**: Lista de publicaciones filtradas con botones de categoría y votación
- **MapView.jsx**: Mapa Leaflet con marcadores codificados por color según categoría
- **UploadForm.jsx**: Formulario de 2 pasos (selección de categoría → detalles) con subida de imagen
- **AuthModal.jsx**: Auth de Supabase para login/registro

## Patrones de Flujo de Datos
- Publicaciones obtenidas al montar, suscripciones en tiempo real para nuevas ([src/context/AppContext.jsx#L60-75](src/context/AppContext.jsx#L60-75))
- Actualizaciones optimistas para votación ([src/context/AppContext.jsx#L95-110](src/context/AppContext.jsx#L95-110))
- Subidas de imagen a bucket 'posts' de Supabase Storage ([src/components/UploadForm.jsx#L51-65](src/components/UploadForm.jsx#L51-65))
- Generación aleatoria de lat/lng cerca del centro de General Rodríguez (-34.6083, -58.9392)

## Convenciones de Estilo
- Usar variables CSS para colores (ej. `var(--primary)`, `var(--cat-precios)`)
- Aplicar clase `glass-card` para fondos de vidrio esmerilado
- Badges de categoría: `badge-prices`, `badge-security`, `badge-services`, `badge-trash`
- Estilos inline preferidos sobre clases para componentes específicos
- Responsive: max-width 600px en feed, viewport completo en mapa

## Flujo de Desarrollo
- **Iniciar servidor dev**: `npm run dev` (servidor Vite)
- **Build**: `npm run build` (salida a `dist/`)
- **Entorno**: Configurar `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` en `.env`
- **Testing**: Sin tests formales; probar manualmente auth, publicación, votación y updates en tiempo real (ej. ejecutar `npm run dev` y verificar login en AuthModal)
- **Linting**: No configurado; seguir mejores prácticas de React

## Patrones Específicos
- **Categorías**: Lista hardcoded en UploadForm; mapear a íconos/emojis y colores
- **Barrios**: Lista ordenada en AppContext; "Todos los Barrios" para todos
- **Publicaciones anónimas**: Checkbox en formulario; almacenar como booleano `is_anonymous`
- **Moderación**: Verificación de malas palabras del lado cliente antes de enviar ([src/components/UploadForm.jsx#L35-40](src/components/UploadForm.jsx#L35-40))
- **Auth**: Auth de Supabase con email/password; opcional para publicar
- **Votación**: Botón "Me sirve"; incrementa campo `votes` de forma optimista
- **Animaciones**: Usar Framer Motion para transiciones suaves (ej. en UploadForm)

## Despliegue
- **Plataforma**: Vercel con config `vercel.json`
- **PWA**: Manifest para app standalone ([public/manifest.json](public/manifest.json))
- **Dominio**: Asume dominio personalizado; tags OG para compartir

Seguir convenciones de texto UI en español. Priorizar diseño responsive mobile-first. Usar íconos Lucide consistentemente.