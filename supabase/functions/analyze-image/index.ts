import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// Interfaz para respuesta de Vision API
interface FaceAnnotation {
  boundingPoly?: { vertices: Array<{ x: number; y: number }> }
  confidence?: number
  detectionConfidence?: number
}

interface VisionResponse {
  responses: Array<{
    faceAnnotations?: FaceAnnotation[]
    error?: { message: string }
  }>
}

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const payload = await req.json()
    const { record } = payload
    const fileName = record.name

    if (!fileName) {
      console.error('❌ No fileName provided')
      return new Response(JSON.stringify({ error: 'No fileName provided' }), { status: 400 })
    }

    // Extraer postId del fileName (formato: postId.ext)
    const postId = parseInt(fileName.split('.')[0])
    
    if (isNaN(postId)) {
      console.error(`❌ Invalid postId extracted from fileName: ${fileName}`)
      return new Response(JSON.stringify({ error: 'Invalid postId' }), { status: 400 })
    }

    console.log(`🔍 Analizando imagen para postId: ${postId}, fileName: ${fileName}`)

    // Obtener URL pública de la imagen
    const { data } = supabase.storage.from('posts').getPublicUrl(fileName)
    const imageUrl = data.publicUrl

    if (!imageUrl) {
      console.error('❌ Could not get public URL for image')
      return new Response(JSON.stringify({ error: 'Could not get public URL' }), { status: 500 })
    }

    console.log(`📸 Imagen URL: ${imageUrl}`)

    // Llamar a Google Vision API para detectar caras
    const apiKey = Deno.env.get('GOOGLE_VISION_API_KEY')
    
    if (!apiKey) {
      console.error('❌ GOOGLE_VISION_API_KEY no configurada')
      return new Response(JSON.stringify({ error: 'API key not configured' }), { status: 500 })
    }

    const visionResponse = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requests: [{
          image: { source: { imageUri: imageUrl } },
          features: [
            { type: 'FACE_DETECTION', maxResults: 10 },
            { type: 'SAFE_SEARCH_DETECTION' }
          ]
        }]
      })
    })

    const result: VisionResponse = await visionResponse.json()

    console.log(`📊 Vision API Response:`, JSON.stringify(result, null, 2))

    if (!visionResponse.ok) {
      console.error(`❌ Vision API error: ${visionResponse.status}`)
      return new Response(JSON.stringify({ error: 'Vision API error' }), { status: 500 })
    }

    const response = result.responses?.[0]
    
    if (response?.error) {
      console.error(`❌ Vision API error response: ${response.error.message}`)
      return new Response(JSON.stringify({ error: response.error.message }), { status: 500 })
    }

    const faceAnnotations = response?.faceAnnotations || []
    const safeSearch = response?.safeSearchAnnotation

    console.log(`👤 Caras detectadas: ${faceAnnotations.length}`)

    // Eliminar si hay caras detectadas con confianza > 30%
    if (faceAnnotations.length > 0) {
      const facesWithConfidence = faceAnnotations.filter(face => {
        const confidence = face.detectionConfidence || face.confidence || 0
        return confidence > 0.3 // 30% de confianza
      })

      if (facesWithConfidence.length > 0) {
        console.log(`⚠️ Caras detectadas con confianza > 30%: ${facesWithConfidence.length}`)
        
        // Eliminar archivo
        try {
          const { error: deleteStorageError } = await supabase.storage
            .from('posts')
            .remove([fileName])
          
          if (deleteStorageError) {
            console.error('Error al eliminar imagen:', deleteStorageError)
          } else {
            console.log('✅ Archivo eliminado de storage')
          }
        } catch (e) {
          console.error('Error deleting storage:', e)
        }

        // Eliminar post
        try {
          const { error: deletePostError } = await supabase
            .from('posts')
            .delete()
            .eq('id', postId)
          
          if (deletePostError) {
            console.error('Error al eliminar post:', deletePostError)
          } else {
            console.log('✅ Post eliminado de base de datos')
          }
        } catch (e) {
          console.error('Error deleting post:', e)
        }

        return new Response(JSON.stringify({
          status: 'rejected',
          reason: 'Face detected',
          message: '⚠️ Imagen rechazada: Contiene rostros de personas. Por tu privacidad y la de otros, no se permiten estas imágenes.'
        }), { status: 200 })
      }
    }

    // Validar contenido inapropiado
    if (safeSearch) {
      const inappropriate = safeSearch.adult === 'LIKELY' || safeSearch.adult === 'VERY_LIKELY' ||
                           safeSearch.violence === 'LIKELY' || safeSearch.violence === 'VERY_LIKELY'
      
      if (inappropriate) {
        console.log('⚠️ Contenido inapropiado detectado')
        
        try {
          await supabase.storage.from('posts').remove([fileName])
          await supabase.from('posts').delete().eq('id', postId)
        } catch (e) {
          console.error('Error cleaning up:', e)
        }

        return new Response(JSON.stringify({
          status: 'rejected',
          reason: 'Inappropriate content',
          message: '⚠️ Imagen rechazada: Contiene contenido inapropiado.'
        }), { status: 200 })
      }
    }

    console.log('✅ Imagen aprobada')
    return new Response(JSON.stringify({
      status: 'approved',
      message: 'Imagen aprobada - sin rostros detectados'
    }), { status: 200 })

  } catch (error) {
    console.error('❌ Error en analyze-image:', error)
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), { status: 500 })
  }
})