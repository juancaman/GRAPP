#!/bin/bash

# 🔒 Script de Configuración - Google Vision API + Supabase

echo "🚀 Configurando Google Vision API para análisis de imágenes..."
echo ""

# Verificar si tenemos supabase CLI
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI no instalado. Instálalo con:"
    echo "   npm install -g @supabase/cli"
    exit 1
fi

echo "📋 Pasos de configuración:"
echo ""
echo "1️⃣  Crear proyecto en Google Cloud"
echo "   → Ir a: https://console.cloud.google.com/"
echo "   → Crear nuevo proyecto"
echo "   → Habilitar 'Vision API'"
echo "   → Crear credencial (API Key)"
echo ""
echo "2️⃣  Guardar API Key (te la pediremos en el siguiente paso)"
echo ""

read -p "¿Tienes tu Google Vision API Key? (s/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Ss]$ ]]; then
    read -p "Pega tu API Key: " API_KEY
    
    if [ -z "$API_KEY" ]; then
        echo "❌ API Key vacía. Abortando."
        exit 1
    fi
    
    echo ""
    echo "⏳ Configurando Supabase..."
    
    # Configurar en Supabase
    supabase secrets set GOOGLE_VISION_API_KEY="$API_KEY"
    
    if [ $? -eq 0 ]; then
        echo "✅ API Key configurada en Supabase!"
        echo ""
        echo "📦 Deploying función..."
        supabase functions deploy analyze-image
        
        if [ $? -eq 0 ]; then
            echo "✅ Función desplegada exitosamente!"
            echo ""
            echo "📍 Próximo paso: Configurar Storage Trigger"
            echo "   → Supabase Dashboard → Storage → posts"
            echo "   → Create New Trigger"
            echo "   → Event: s3:ObjectCreated:*"
            echo "   → Function: analyze-image"
            echo ""
            echo "✨ ¡Todo listo! El sistema de protección de privacidad está activo."
        else
            echo "❌ Error al desplegar la función. Intenta manualmente:"
            echo "   supabase functions deploy analyze-image"
        fi
    else
        echo "❌ Error al configurar API Key. Intenta manualmente:"
        echo "   supabase secrets set GOOGLE_VISION_API_KEY=<TU_KEY>"
    fi
else
    echo ""
    echo "📖 Para obtener tu API Key:"
    echo "   1. Ve a: https://console.cloud.google.com/"
    echo "   2. Crea un nuevo proyecto"
    echo "   3. Habilita 'Vision API' en APIs y servicios"
    echo "   4. Crea una credencial (API Key)"
    echo "   5. Copia la key y ejecuta este script de nuevo"
    echo ""
    echo "O configura manualmente:"
    echo "   supabase secrets set GOOGLE_VISION_API_KEY=<TU_KEY>"
    echo "   supabase functions deploy analyze-image"
fi

echo ""
echo "📚 Documentación completa:"
echo "   → Ver SETUP_IMAGE_ANALYSIS.md"
