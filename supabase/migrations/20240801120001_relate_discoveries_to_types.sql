-- First, we need to handle existing data. We'll add the new column,
-- populate it based on the old text column, and then drop the old column.
-- Note: This assumes the 'discovery_types' table has been created and populated
-- with 'Produto', 'Lugar', 'Pessoa'.

-- Add the new integer column for the foreign key relationship
ALTER TABLE public.discoveries
ADD COLUMN type_id INTEGER;

-- Create the foreign key constraint
ALTER TABLE public.discoveries
ADD CONSTRAINT discoveries_type_id_fkey
FOREIGN KEY (type_id) REFERENCES public.discovery_types(id);

-- Update the new type_id column based on the values in the old text 'type' column
UPDATE public.discoveries d
SET type_id = dt.id
FROM public.discovery_types dt
WHERE d.type = dt.name;

-- Now that the data is migrated, we can drop the old 'type' column
ALTER TABLE public.discoveries
DROP COLUMN type;

-- Also, let's ensure the submissions table is also updated to use the ID.
-- The previous migration might have missed altering the table itself.
ALTER TABLE public.submissions
ALTER COLUMN type SET DATA TYPE INTEGER
USING type::integer;

-- Add the foreign key constraint to the submissions table
ALTER TABLE public.submissions
ADD CONSTRAINT submissions_type_fkey
FOREIGN KEY (type) REFERENCES public.discovery_types(id);
