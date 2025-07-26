
-- Adicionar colunas de latitude e longitude à tabela de descobertas
ALTER TABLE public.discoveries
ADD COLUMN latitude double precision,
ADD COLUMN longitude double precision;

-- Opcional: Adicionar um índice para pesquisas geoespaciais, se necessário no futuro
CREATE INDEX discoveries_lat_lon_idx ON public.discoveries (latitude, longitude);

-- Ativar RLS para as novas colunas
ALTER TABLE public.discoveries ENABLE ROW LEVEL SECURITY;
