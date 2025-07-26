-- 1. Create the new discovery_types table
CREATE TABLE IF NOT EXISTS public.discovery_types (
    id smallint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name text NOT NULL UNIQUE
);

-- 2. Enable RLS and define policies
ALTER TABLE public.discovery_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read discovery types" ON public.discovery_types FOR SELECT USING (true);

-- 3. Insert the initial data
INSERT INTO public.discovery_types (name) VALUES ('Produto'), ('Lugar'), ('Pessoa')
ON CONFLICT (name) DO NOTHING;


-- 4. Migrate 'discoveries' table
-- Add a temporary column for the new foreign key
ALTER TABLE public.discoveries ADD COLUMN type_id_temp smallint;

-- Populate the temporary column with the correct IDs from the new table
-- CASTING the enum type to text to allow the comparison
UPDATE public.discoveries SET type_id_temp = (SELECT id FROM public.discovery_types WHERE name = public.discoveries.type::text);

-- Drop the old enum type column
ALTER TABLE public.discoveries DROP COLUMN type;

-- Rename the temporary column to the final column name
ALTER TABLE public.discoveries RENAME COLUMN type_id_temp TO type_id;

-- Add the foreign key constraint
ALTER TABLE public.discoveries ADD CONSTRAINT fk_discovery_types FOREIGN KEY (type_id) REFERENCES public.discovery_types(id);


-- 5. Migrate 'submissions' table
-- Add a temporary column for the new foreign key
ALTER TABLE public.submissions ADD COLUMN type_id_temp smallint;

-- Populate the temporary column
-- CASTING the enum type to text to allow the comparison
UPDATE public.submissions SET type_id_temp = (SELECT id FROM public.discovery_types WHERE name = public.submissions.type::text);

-- Drop the old enum type column
ALTER TABLE public.submissions DROP COLUMN type;

-- Rename the temporary column to the final column name
ALTER TABLE public.submissions RENAME COLUMN type_id_temp TO type;

-- Update the new 'type' column to be not null
ALTER TABLE public.submissions ALTER COLUMN type SET NOT NULL;

-- Add the foreign key constraint
ALTER TABLE public.submissions ADD CONSTRAINT fk_submission_discovery_types FOREIGN KEY (type) REFERENCES public.discovery_types(id);


-- 6. Drop the now unused enum type
DROP TYPE IF EXISTS public.discovery_type_enum;
