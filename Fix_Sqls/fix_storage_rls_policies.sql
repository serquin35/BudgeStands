-- Configuración de RLS para Storage: bucket stand-uploads
-- Ejecutar en el SQL Editor de Supabase Dashboard

-- 1. Habilitar RLS en storage.objects (si no está ya habilitado)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 2. Eliminar políticas previas si existen
DROP POLICY IF EXISTS "Upload access to stand-uploads" ON storage.objects;
DROP POLICY IF EXISTS "Public read access to stand-uploads" ON storage.objects;

-- 3. Permitir subida de archivos a usuarios autenticados en el bucket stand-uploads
CREATE POLICY "Upload access to stand-uploads"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'stand-uploads'
);

-- 4. Permitir lectura pública de archivos en stand-uploads
CREATE POLICY "Public read access to stand-uploads"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'stand-uploads');

-- 5. Permitir UPDATE/DELETE solo al propietario del archivo
CREATE POLICY "Owner update access to stand-uploads"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'stand-uploads' AND owner = auth.uid())
WITH CHECK (bucket_id = 'stand-uploads' AND owner = auth.uid());

CREATE POLICY "Owner delete access to stand-uploads"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'stand-uploads' AND owner = auth.uid());
