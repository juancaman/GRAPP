-- 1. Habilitar RLS en la tabla posts
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Limpieza de políticas existentes (Evita el error de "already exists")
DROP POLICY IF EXISTS "Public posts are viewable by everyone" ON posts;
DROP POLICY IF EXISTS "Anyone can upload posts" ON posts;
DROP POLICY IF EXISTS "Users can update own posts" ON posts;
DROP POLICY IF EXISTS "Users can delete own posts" ON posts;

-- 2. Permitir que CUALQUIERA pueda VER los posts (Público)
CREATE POLICY "Public posts are viewable by everyone" 
ON posts FOR SELECT 
USING (true);

-- 3. Permitir que CUALQUIERA pueda CREAR posts
CREATE POLICY "Anyone can upload posts" 
ON posts FOR INSERT 
WITH CHECK (
  (auth.uid() IS NULL) OR (auth.uid() = user_id)
);

-- 4. Permitir que SOLO el autor pueda EDITAR su post (excepto votos)
CREATE POLICY "Users can update own posts" 
ON posts FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 5. Permitir que SOLO el autor pueda BORRAR su post
CREATE POLICY "Users can delete own posts" 
ON posts FOR DELETE 
USING (auth.uid() = user_id);

-- 6. Función SEGURA para votar
-- Eliminamos la versión anterior si existe para evitar conflictos de tipos
DROP FUNCTION IF EXISTS increment_votes(uuid);
DROP FUNCTION IF EXISTS increment_votes(bigint);

CREATE OR REPLACE FUNCTION increment_votes(post_id BIGINT)
RETURNS VOID AS $$
BEGIN
  UPDATE posts
  SET votes = COALESCE(votes, 0) + 1
  WHERE id = post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Configuración para Storage (Imágenes)
INSERT INTO storage.buckets (id, name, public) VALUES ('posts', 'posts', true)
ON CONFLICT (id) DO NOTHING;

-- Limpieza de políticas de Storage
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Allow Uploads" ON storage.objects;
DROP POLICY IF EXISTS "Give public access to images" ON storage.objects;
DROP POLICY IF EXISTS "Allow public uploads" ON storage.objects;

-- Ver imágenes: Público
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'posts');

-- Subir imágenes
CREATE POLICY "Allow Uploads" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'posts');

-- 8. Tabla de REPORTES (para moderación)
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id BIGINT REFERENCES public.posts(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    reporter_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS en reports
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Cualquiera puede insertar un reporte
DROP POLICY IF EXISTS "Anyone can report" ON public.reports;
CREATE POLICY "Anyone can report" ON public.reports FOR INSERT WITH CHECK (true);

-- Nadie puede ver reportes (solo admin desde el dashboard)
DROP POLICY IF EXISTS "Only admin can view reports" ON public.reports;
CREATE POLICY "Only admin can view reports" ON public.reports FOR SELECT USING (false);

-- 9. Tabla de COMENTARIOS (comunidad)
CREATE TABLE IF NOT EXISTS public.comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id BIGINT REFERENCES public.posts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    author_name TEXT,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS en comments
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Cualquiera puede ver los comentarios
DROP POLICY IF EXISTS "Anyone can view comments" ON public.comments;
CREATE POLICY "Anyone can view comments" ON public.comments FOR SELECT USING (true);

-- Usuarios autenticados pueden comentar
DROP POLICY IF EXISTS "Authenticated users can comment" ON public.comments;
CREATE POLICY "Authenticated users can comment" ON public.comments FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Solo el autor o admin pueden borrar comentarios
DROP POLICY IF EXISTS "Users can delete own comments" ON public.comments;
CREATE POLICY "Users can delete own comments" ON public.comments FOR DELETE USING (auth.uid() = user_id);
