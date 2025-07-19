-- Drop existing objects to avoid "already exists" errors
DROP VIEW IF EXISTS public.discovery_seal_counts;
DROP TABLE IF EXISTS public.seals;
DROP TABLE IF EXISTS public.submissions;
DROP TABLE IF EXISTS public.discoveries;
DROP TABLE IF EXISTS public.confrarias;
DROP TYPE IF EXISTS public.discovery_type;
DROP TYPE IF EXISTS public.region_type;
DROP TYPE IF EXISTS public.submission_status;

-- Recreate types
CREATE TYPE public.region_type AS ENUM ('Norte', 'Centro', 'Lisboa', 'Alentejo', 'Algarve', 'Açores', 'Madeira');
CREATE TYPE public.discovery_type AS ENUM ('Produto', 'Lugar', 'Pessoa');
CREATE TYPE public.submission_status AS ENUM ('Pendente', 'Aprovado', 'Rejeitado');

-- Create Confrarias Table
-- This table stores information about the gastronomic brotherhoods.
CREATE TABLE public.confrarias (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    motto TEXT,
    region public.region_type NOT NULL,
    seal_url TEXT,
    seal_hint TEXT
);
-- Enable RLS
ALTER TABLE public.confrarias ENABLE ROW LEVEL SECURITY;
-- Allow public read access
CREATE POLICY "Allow public read access to confrarias" ON public.confrarias FOR SELECT USING (true);


-- Create Discoveries Table
-- This table stores the gastronomic discoveries.
CREATE TABLE public.discoveries (
    id SERIAL PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    editorial TEXT,
    region public.region_type NOT NULL,
    type public.discovery_type NOT NULL,
    confraria_id INTEGER REFERENCES public.confrarias(id),
    image_url TEXT,
    image_hint TEXT,
    address TEXT,
    website TEXT,
    phone TEXT
);
-- Enable RLS
ALTER TABLE public.discoveries ENABLE ROW LEVEL SECURITY;
-- Allow public read access
CREATE POLICY "Allow public read access to discoveries" ON public.discoveries FOR SELECT USING (true);


-- Create Submissions Table
-- This table stores user suggestions for new discoveries.
CREATE TABLE public.submissions (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    discovery_title TEXT NOT NULL,
    editorial TEXT,
    region public.region_type,
    type public.discovery_type,
    confraria_id INTEGER REFERENCES public.confrarias(id),
    links TEXT,
    status public.submission_status DEFAULT 'Pendente',
    date DATE NOT NULL,
    CONSTRAINT submissions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);
-- Enable RLS
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
-- Allow users to manage their own submissions
CREATE POLICY "Allow users to manage their own submissions" ON public.submissions 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);


-- Create Seals Table
-- This is a join table for users sealing discoveries (liking/vouching).
CREATE TABLE public.seals (
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    discovery_id INTEGER NOT NULL REFERENCES public.discoveries(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, discovery_id)
);
-- Enable RLS
ALTER TABLE public.seals ENABLE ROW LEVEL SECURITY;
-- Allow users to manage their own seals
CREATE POLICY "Allow users to manage their own seals" ON public.seals
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);


-- Create a view to count seals per discovery
-- This makes it easier and more performant to get the seal count.
CREATE OR REPLACE VIEW public.discovery_seal_counts AS
SELECT
    discovery_id,
    count(*) as seal_count
FROM
    public.seals
GROUP BY
    discovery_id;
