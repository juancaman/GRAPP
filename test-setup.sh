#!/bin/bash

# 🧪 Script de Testing - Sistema de Análisis de Imágenes

echo "🧪 Testing Sistema de Protección de Privacidad"
echo "=============================================="
echo ""

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para imprimir resultado
print_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
    fi
}

print_step() {
    echo -e "${BLUE}📍 $1${NC}"
}

# 1. Verificar Node.js
print_step "Verificando Node.js..."
node --version > /dev/null 2>&1
print_result $? "Node.js instalado"

# 2. Verificar npm
print_step "Verificando npm..."
npm --version > /dev/null 2>&1
print_result $? "npm instalado"

# 3. Verificar Supabase CLI
print_step "Verificando Supabase CLI..."
supabase --version > /dev/null 2>&1
print_result $? "Supabase CLI instalado"

# 4. Verificar archivos de configuración
echo ""
print_step "Verificando archivos..."

# index.html
if grep -q "face-api" index.html; then
    print_result 0 "face-api.js cargado en index.html"
else
    print_result 1 "face-api.js NO encontrado en index.html"
fi

# UploadForm.jsx
if grep -q "faceApiReady" src/components/UploadForm.jsx; then
    print_result 0 "Detección de rostros en UploadForm.jsx"
else
    print_result 1 "Detección de rostros NO encontrada en UploadForm.jsx"
fi

# analyze-image function
if [ -f "supabase/functions/analyze-image/index.ts" ]; then
    print_result 0 "Función analyze-image existe"
    
    if grep -q "FACE_DETECTION" supabase/functions/analyze-image/index.ts; then
        print_result 0 "Google Vision API configurada en analyze-image"
    else
        print_result 1 "Google Vision API NO encontrada en analyze-image"
    fi
else
    print_result 1 "Función analyze-image NO existe"
fi

# 5. Verificar dependencias
echo ""
print_step "Verificando dependencias principales..."

if grep -q "react" package.json; then
    print_result 0 "React configurado"
else
    print_result 1 "React NO encontrado"
fi

if grep -q "supabase" package.json; then
    print_result 0 "Supabase configurado"
else
    print_result 1 "Supabase NO encontrado"
fi

if grep -q "leaflet" package.json; then
    print_result 0 "Leaflet configurado"
else
    print_result 1 "Leaflet NO encontrado"
fi

# 6. Verificar variable de entorno
echo ""
print_step "Verificando configuración de Supabase..."

if [ -f ".env.local" ] || [ -f ".env" ]; then
    print_result 0 ".env encontrado"
else
    print_result 1 ".env NO encontrado (crear uno)"
fi

# 7. Resumen
echo ""
echo "=============================================="
echo -e "${YELLOW}📋 Próximos pasos:${NC}"
echo ""
echo "1. Crear Google Vision API Key:"
echo "   → https://console.cloud.google.com/"
echo ""
echo "2. Configurar en Supabase:"
echo "   supabase secrets set GOOGLE_VISION_API_KEY=<TU_KEY>"
echo ""
echo "3. Desplegar función:"
echo "   supabase functions deploy analyze-image"
echo ""
echo "4. Configurar Storage Trigger:"
echo "   → Dashboard → Storage → posts → New Trigger"
echo "   → Event: s3:ObjectCreated:*"
echo "   → Function: analyze-image"
echo ""
echo "5. Iniciar desarrollo:"
echo "   npm run dev"
echo ""
echo "=============================================="
echo -e "${GREEN}✨ Sistema listo para testing${NC}"
