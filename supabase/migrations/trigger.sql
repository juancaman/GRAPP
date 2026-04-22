-- Crear el trigger para invocar la función 'analyze-image'
-- al subir un nuevo archivo al bucket 'posts'

-- 1. Definir la función que se ejecutará en el trigger
create or replace function public.handle_new_image()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  -- Invocar la Edge Function 'analyze-image'
  perform net.http_post(
    url:= 'https://tkgjeteadpodcleflawj.supabase.co/functions/v1/analyze-image',
    headers:= '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRrZ2pldGVhZHBvZGNsZWZsYXdqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyMTc2ODYzNCwiZXhwIjoyMDM3MzQ0NjM0fQ.0-plH1Z4j-u-Yj-u-Yj-u-Yj-u-Yj-u-Yj-u-Yg"}'::jsonb,
    body:= jsonb_build_object('record', new)
  );
  return new;
end;
$$;

-- 2. Crear el trigger que se dispara después de una inserción en storage.objects
create or replace trigger on_new_image_upload
  after insert on storage.objects
  for each row
  when (new.bucket_id = 'posts')
  execute procedure public.handle_new_image();
