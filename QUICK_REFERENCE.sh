#!/usr/bin/env bash
# 🚀 Quick Reference - Comandos Clave

# ==============================================================================
# 1. SETUP INICIAL
# ==============================================================================

echo "📦 1. Setup Inicial"
npm install                    # Instalar dependencias
npm run dev                    # Iniciar servidor de desarrollo

# ==============================================================================
# 2. GOOGLE VISION API SETUP
# ==============================================================================

echo "🔑 2. Configurar Google Vision API"

# A. Crear proyecto en Google Cloud Console
# https://console.cloud.google.com/
# Steps:
#   1. Create new project
#   2. Enable "Vision API"
#   3. Create API Key credential
#   4. Copy the key

# B. Configurar en Supabase
# REEMPLAZA <TU_API_KEY> con la key de Google
supabase secrets set GOOGLE_VISION_API_KEY="<TU_API_KEY>"

# C. Desplegar función
supabase functions deploy analyze-image

# ==============================================================================
# 3. STORAGE TRIGGER
# ==============================================================================

echo "⚙️ 3. Configurar Storage Trigger"
# En Supabase Dashboard:
# 1. Go to: Storage → posts
# 2. Click: "Create New Trigger"
# 3. Select Event: s3:ObjectCreated:*
# 4. Select Function: analyze-image
# 5. Click: Create Trigger

# ==============================================================================
# 4. TESTING
# ==============================================================================

echo "🧪 4. Testing"

# Test script (verifica configuración)
# Linux/Mac:
chmod +x test-setup.sh
./test-setup.sh

# Windows:
powershell -ExecutionPolicy Bypass -File test-setup.ps1

# Ver logs de desarrollo
npm run dev     # Terminal 1

# Ver logs de función Supabase
supabase functions logs analyze-image  # Terminal 2

# Ver logs del navegador
# F12 → Console tab

# ==============================================================================
# 5. DESARROLLO
# ==============================================================================

echo "💻 5. Desarrollo"

# Iniciar servidor (con hot reload)
npm run dev

# Build para producción
npm run build

# Preview de build local
npm run preview

# ==============================================================================
# 6. GIT & DEPLOYMENT
# ==============================================================================

echo "🚀 6. Deployment"

# Commit cambios
git add .
git commit -m "feat: Implementar sistema de protección de privacidad"

# Push a GitHub
git push origin main

# Deploy en Vercel (automático si está conectado)
# O usando CLI:
vercel --prod

# ==============================================================================
# 7. MONITOREO
# ==============================================================================

echo "📊 7. Monitoreo"

# Ver logs de función
supabase functions logs analyze-image

# Ver logs en tiempo real
supabase functions logs analyze-image --follow

# Listar todas las funciones
supabase functions list

# Ver detalles de función
supabase functions download analyze-image

# ==============================================================================
# 8. TROUBLESHOOTING
# ==============================================================================

echo "🔧 8. Troubleshooting"

# Verificar que face-api.js se cargó
# En DevTools Console:
# > window.faceapi   // Debe existir
# > window.faceApiReady  // Debe ser true

# Verificar API Key
supabase secrets list

# Redeploy función si hay cambios
supabase functions deploy analyze-image --force

# Revisar logs recientes
supabase functions logs analyze-image | tail -20

# ==============================================================================
# 9. DOCUMENTACIÓN
# ==============================================================================

echo "📚 9. Ver Documentación"

# Guía rápida
cat README_IMAGE_ANALYSIS.md

# Detalles completos
cat SETUP_IMAGE_ANALYSIS.md

# Cambios implementados
cat CAMBIOS_IMPLEMENTADOS.md

# Verificación rápida
cat VERIFICACION_RAPIDA.md

# ==============================================================================
# 10. IMPORTANTE
# ==============================================================================

echo "⚠️ 10. Puntos Importantes"

# SIN CONFIGURAR API KEY: Sistema solo valida en cliente (face-api.js)
# CON API KEY: Sistema valida en cliente + servidor (Google Vision)

# La validación en cliente es instantánea
# La validación en servidor es automática tras subir

# Logs para debugging:
# - Cliente: F12 → Console
# - Servidor: supabase functions logs analyze-image

# ==============================================================================
# 11. IMÁGENES DE PRUEBA
# ==============================================================================

echo "📸 11. Imágenes de Prueba"

# Con rostro (debe bloquearse):
# https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400

# Sin rostro (debe permitirse):
# https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400

# ==============================================================================
# 12. VARIABLES DE ENTORNO
# ==============================================================================

echo "🔐 12. Variables de Entorno"

# .env o .env.local debe contener:
# VITE_SUPABASE_URL=<TU_URL>
# VITE_SUPABASE_ANON_KEY=<TU_KEY>

# Supabase secrets (para funciones):
# supabase secrets set GOOGLE_VISION_API_KEY=<TU_KEY>

# ==============================================================================
# 13. URLS ÚTILES
# ==============================================================================

echo "🔗 13. URLs Útiles"

# Local development:
# http://localhost:5173

# Google Cloud Console:
# https://console.cloud.google.com/

# Supabase Dashboard:
# https://app.supabase.com/

# GitHub Actions:
# https://github.com/<username>/GRAPP/actions

# Vercel Dashboard:
# https://vercel.com/dashboard

# ==============================================================================
# 14. COMANDOS ÚTILES
# ==============================================================================

echo "⚡ 14. Comandos Rápidos"

# Limpiar y reinstalar
rm -rf node_modules package-lock.json
npm install

# Ver estado de Git
git status

# Ver cambios sin stagear
git diff

# Ver historial
git log --oneline

# ==============================================================================
# FIN
# ==============================================================================

echo "✅ Quick Reference Lista!"
echo ""
echo "Próximos pasos:"
echo "1. Obtener API Key: https://console.cloud.google.com/"
echo "2. Ejecutar: supabase secrets set GOOGLE_VISION_API_KEY=<KEY>"
echo "3. Ejecutar: supabase functions deploy analyze-image"
echo "4. Configurar trigger en Dashboard"
echo "5. npm run dev y probar"
echo ""
