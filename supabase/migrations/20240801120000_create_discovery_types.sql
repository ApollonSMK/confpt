-- Create the discovery_types table
CREATE TABLE IF NOT EXISTS public.discovery_types (
    id smallint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name text NOT NULL UNIQUE
);

-- Enable RLS
ALTER TABLE public.discovery_types ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access to discovery types"
ON public.discovery_types
FOR SELECT
TO public
USING (true);


-- Insert initial data
INSERT INTO public.discovery_types (name) VALUES
('Produto'),
('Lugar'),
('Pessoa');


-- Create a temporary column on discoveries to hold the new type_id
ALTER TABLE public.discoveries ADD COLUMN type_id_temp smallint;

-- Update the temporary column based on the old text values
UPDATE public.discoveries SET type_id_temp = (SELECT id FROM public.discovery_types WHERE name = public.discoveries.type);

-- Drop the old text column
ALTER TABLE public.discoveries DROP COLUMN type;

-- Rename the temporary column to the final name
ALTER TABLE public.discoveries RENAME COLUMN type_id_temp TO type_id;

-- Add the foreign key constraint
ALTER TABLE public.discoveries ADD CONSTRAINT discoveries_type_id_fkey FOREIGN KEY (type_id) REFERENCES public.discovery_types (id);


-- Update the submissions table to use the new foreign key
-- We assume the 'type' column in submissions already stores an integer ID,
-- we just need to add the foreign key constraint.
ALTER TABLE public.submissions ADD CONSTRAINT submissions_type_fkey FOREIGN KEY (type) REFERENCES public.discovery_types(id);
