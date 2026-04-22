# 🧪 Script de Testing - Sistema de Análisis de Imágenes (Windows)

Write-Host "🧪 Testing Sistema de Protección de Privacidad" -ForegroundColor Cyan
Write-Host "=============================================="
Write-Host ""

# Función para imprimir resultado
function Print-Result {
    param(
        [int]$ExitCode,
        [string]$Message
    )
    if ($ExitCode -eq 0) {
        Write-Host "✅ $Message" -ForegroundColor Green
    } else {
        Write-Host "❌ $Message" -ForegroundColor Red
    }
}

function Print-Step {
    param([string]$Message)
    Write-Host "📍 $Message" -ForegroundColor Blue
}

# 1. Verificar Node.js
Print-Step "Verificando Node.js..."
try {
    $null = node --version
    Print-Result 0 "Node.js instalado"
} catch {
    Print-Result 1 "Node.js NO instalado"
}

# 2. Verificar npm
Print-Step "Verificando npm..."
try {
    $null = npm --version
    Print-Result 0 "npm instalado"
} catch {
    Print-Result 1 "npm NO instalado"
}

# 3. Verificar Supabase CLI
Print-Step "Verificando Supabase CLI..."
try {
    $null = supabase --version
    Print-Result 0 "Supabase CLI instalado"
} catch {
    Print-Result 1 "Supabase CLI NO instalado"
}

# 4. Verificar archivos de configuración
Write-Host ""
Print-Step "Verificando archivos..."

# index.html
$indexContent = Get-Content "index.html" -Raw
if ($indexContent -match "face-api") {
    Print-Result 0 "face-api.js cargado en index.html"
} else {
    Print-Result 1 "face-api.js NO encontrado en index.html"
}

# UploadForm.jsx
$uploadFormContent = Get-Content "src/components/UploadForm.jsx" -Raw
if ($uploadFormContent -match "faceApiReady") {
    Print-Result 0 "Detección de rostros en UploadForm.jsx"
} else {
    Print-Result 1 "Detección de rostros NO encontrada en UploadForm.jsx"
}

# analyze-image function
$analyzePath = "supabase/functions/analyze-image/index.ts"
if (Test-Path $analyzePath) {
    Print-Result 0 "Función analyze-image existe"
    
    $analyzeContent = Get-Content $analyzePath -Raw
    if ($analyzeContent -match "FACE_DETECTION") {
        Print-Result 0 "Google Vision API configurada en analyze-image"
    } else {
        Print-Result 1 "Google Vision API NO encontrada en analyze-image"
    }
} else {
    Print-Result 1 "Función analyze-image NO existe"
}

# 5. Verificar dependencias
Write-Host ""
Print-Step "Verificando dependencias principales..."

$packageContent = Get-Content "package.json" -Raw

if ($packageContent -match '"react"') {
    Print-Result 0 "React configurado"
} else {
    Print-Result 1 "React NO encontrado"
}

if ($packageContent -match '"supabase"') {
    Print-Result 0 "Supabase configurado"
} else {
    Print-Result 1 "Supabase NO encontrado"
}

if ($packageContent -match '"leaflet"') {
    Print-Result 0 "Leaflet configurado"
} else {
    Print-Result 1 "Leaflet NO encontrado"
}

# 6. Verificar variable de entorno
Write-Host ""
Print-Step "Verificando configuración de Supabase..."

if ((Test-Path ".env.local") -or (Test-Path ".env")) {
    Print-Result 0 ".env encontrado"
} else {
    Print-Result 1 ".env NO encontrado (crear uno)"
}

# 7. Resumen
Write-Host ""
Write-Host "=============================================="
Write-Host "📋 Próximos pasos:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Crear Google Vision API Key:" -ForegroundColor Gray
Write-Host "   → https://console.cloud.google.com/" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Configurar en Supabase:" -ForegroundColor Gray
Write-Host "   supabase secrets set GOOGLE_VISION_API_KEY=<TU_KEY>" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Desplegar función:" -ForegroundColor Gray
Write-Host "   supabase functions deploy analyze-image" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Configurar Storage Trigger:" -ForegroundColor Gray
Write-Host "   → Dashboard → Storage → posts → New Trigger" -ForegroundColor Gray
Write-Host "   → Event: s3:ObjectCreated:*" -ForegroundColor Gray
Write-Host "   → Function: analyze-image" -ForegroundColor Gray
Write-Host ""
Write-Host "5. Iniciar desarrollo:" -ForegroundColor Gray
Write-Host "   npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "=============================================="
Write-Host "✨ Sistema listo para testing" -ForegroundColor Green
