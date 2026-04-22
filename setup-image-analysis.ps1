# 🔒 Script de Configuración - Google Vision API + Supabase (Windows)

Write-Host "🚀 Configurando Google Vision API para análisis de imágenes..." -ForegroundColor Cyan
Write-Host ""

# Verificar si tenemos supabase CLI
try {
    $null = supabase --version
} catch {
    Write-Host "❌ Supabase CLI no instalado. Instálalo con:" -ForegroundColor Red
    Write-Host "   npm install -g @supabase/cli" -ForegroundColor Yellow
    exit 1
}

Write-Host "📋 Pasos de configuración:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1️⃣  Crear proyecto en Google Cloud" -ForegroundColor Blue
Write-Host "   → Ir a: https://console.cloud.google.com/" -ForegroundColor Gray
Write-Host "   → Crear nuevo proyecto" -ForegroundColor Gray
Write-Host "   → Habilitar 'Vision API'" -ForegroundColor Gray
Write-Host "   → Crear credencial (API Key)" -ForegroundColor Gray
Write-Host ""
Write-Host "2️⃣  Guardar API Key (te la pediremos en el siguiente paso)" -ForegroundColor Blue
Write-Host ""

$response = Read-Host "¿Tienes tu Google Vision API Key? (s/n)"
if ($response -eq "s" -or $response -eq "S") {
    $apiKey = Read-Host "Pega tu API Key"
    
    if ([string]::IsNullOrWhiteSpace($apiKey)) {
        Write-Host "❌ API Key vacía. Abortando." -ForegroundColor Red
        exit 1
    }
    
    Write-Host ""
    Write-Host "⏳ Configurando Supabase..." -ForegroundColor Cyan
    
    # Configurar en Supabase
    $env:GOOGLE_VISION_API_KEY = $apiKey
    supabase secrets set GOOGLE_VISION_API_KEY=$apiKey
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ API Key configurada en Supabase!" -ForegroundColor Green
        Write-Host ""
        Write-Host "📦 Deploying función..." -ForegroundColor Cyan
        supabase functions deploy analyze-image
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Función desplegada exitosamente!" -ForegroundColor Green
            Write-Host ""
            Write-Host "📍 Próximo paso: Configurar Storage Trigger" -ForegroundColor Blue
            Write-Host "   → Supabase Dashboard → Storage → posts" -ForegroundColor Gray
            Write-Host "   → Create New Trigger" -ForegroundColor Gray
            Write-Host "   → Event: s3:ObjectCreated:*" -ForegroundColor Gray
            Write-Host "   → Function: analyze-image" -ForegroundColor Gray
            Write-Host ""
            Write-Host "✨ ¡Todo listo! El sistema de protección de privacidad está activo." -ForegroundColor Green
        } else {
            Write-Host "❌ Error al desplegar la función. Intenta manualmente:" -ForegroundColor Red
            Write-Host "   supabase functions deploy analyze-image" -ForegroundColor Yellow
        }
    } else {
        Write-Host "❌ Error al configurar API Key. Intenta manualmente:" -ForegroundColor Red
        Write-Host "   supabase secrets set GOOGLE_VISION_API_KEY=<TU_KEY>" -ForegroundColor Yellow
    }
} else {
    Write-Host ""
    Write-Host "📖 Para obtener tu API Key:" -ForegroundColor Blue
    Write-Host "   1. Ve a: https://console.cloud.google.com/" -ForegroundColor Gray
    Write-Host "   2. Crea un nuevo proyecto" -ForegroundColor Gray
    Write-Host "   3. Habilita 'Vision API' en APIs y servicios" -ForegroundColor Gray
    Write-Host "   4. Crea una credencial (API Key)" -ForegroundColor Gray
    Write-Host "   5. Copia la key y ejecuta este script de nuevo" -ForegroundColor Gray
    Write-Host ""
    Write-Host "O configura manualmente:" -ForegroundColor Blue
    Write-Host "   supabase secrets set GOOGLE_VISION_API_KEY=<TU_KEY>" -ForegroundColor Yellow
    Write-Host "   supabase functions deploy analyze-image" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📚 Documentación completa:" -ForegroundColor Blue
Write-Host "   → Ver SETUP_IMAGE_ANALYSIS.md" -ForegroundColor Gray
