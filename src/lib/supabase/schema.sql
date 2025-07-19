-- Drop existing objects to start fresh
DROP VIEW IF EXISTS public.discovery_seal_counts;
DROP VIEW IF EXISTS public.user_emails;
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

-- Create Confrarias table
CREATE TABLE public.confrarias (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    motto TEXT,
    region region_type,
    seal_url TEXT,
    seal_hint TEXT
);

-- Create Discoveries table
CREATE TABLE public.discoveries (
    id SERIAL PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    editorial TEXT,
    region region_type,
    type discovery_type,
    confraria_id INTEGER REFERENCES public.confrarias(id),
    image_url TEXT,
    image_hint TEXT,
    address TEXT,
    website TEXT,
    phone TEXT
);

-- Create Submissions table
CREATE TABLE public.submissions (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    discovery_title TEXT NOT NULL,
    editorial TEXT,
    region region_type,
    type discovery_type,
    confraria_id INTEGER REFERENCES public.confrarias(id),
    links TEXT,
    date DATE NOT NULL,
    status submission_status DEFAULT 'Pendente'::public.submission_status,
    CONSTRAINT submissions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create Seals table
CREATE TABLE public.seals (
    user_id UUID NOT NULL,
    discovery_id INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (user_id, discovery_id),
    CONSTRAINT seals_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
    CONSTRAINT seals_discovery_id_fkey FOREIGN KEY (discovery_id) REFERENCES public.discoveries(id) ON DELETE CASCADE
);

-- Create Views for aggregated data
CREATE VIEW public.discovery_seal_counts AS
SELECT
    discovery_id,
    count(*) AS seal_count
FROM
    public.seals
GROUP BY
    discovery_id;

-- NEW VIEW: Create a safe bridge to auth.users
CREATE VIEW public.user_emails AS
SELECT
    id,
    email
FROM
    auth.users;


-- Enable RLS for all tables
ALTER TABLE public.confrarias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discoveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seals ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
-- Allow public read access to confrarias and discoveries
CREATE POLICY "Allow public read access to confrarias" ON public.confrarias FOR SELECT USING (true);
CREATE POLICY "Allow public read access to discoveries" ON public.discoveries FOR SELECT USING (true);

-- Allow users to manage their own submissions
CREATE POLICY "Allow users to read their own submissions" ON public.submissions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Allow users to insert their own submissions" ON public.submissions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow users to manage their own seals
CREATE POLICY "Allow users to read their own seals" ON public.seals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Allow users to insert their own seals" ON public.seals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Allow users to delete their own seals" ON public.seals FOR DELETE USING (auth.uid() = user_id);
