
ALTER TABLE public.events
ADD COLUMN district TEXT,
ADD COLUMN municipality TEXT;

-- Adicionar um comentário para clarificar a mudança
COMMENT ON COLUMN public.events.district IS 'Distrito onde o evento ocorre, para filtros.';
COMMENT ON COLUMN public.events.municipality IS 'Município onde o evento ocorre, para filtros mais detalhados.';

