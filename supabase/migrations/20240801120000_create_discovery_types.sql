
-- 1. Create the new table for discovery types
CREATE TABLE public.discovery_types (
    id bigint NOT NULL,
    name text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- 2. Create the sequence for the primary key
CREATE SEQUENCE public.discovery_types_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.discovery_types_id_seq OWNED BY public.discovery_types.id;
ALTER TABLE ONLY public.discovery_types ALTER COLUMN id SET DEFAULT nextval('public.discovery_types_id_seq'::regclass);

-- 3. Set the primary key
ALTER TABLE ONLY public.discovery_types
    ADD CONSTRAINT discovery_types_pkey PRIMARY KEY (id);

-- 4. Add a unique constraint on the name
ALTER TABLE ONLY public.discovery_types
    ADD CONSTRAINT discovery_types_name_key UNIQUE (name);

-- 5. Enable Row Level Security (RLS)
ALTER TABLE public.discovery_types ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS policy to allow public read access
CREATE POLICY "Enable read access for all users" ON "public"."discovery_types"
AS PERMISSIVE FOR SELECT
TO public
USING (true);


-- 7. Insert the initial data into the new table
INSERT INTO public.discovery_types (name) VALUES ('Produto'), ('Lugar'), ('Pessoa');


-- 8. Alter the existing 'discoveries' table to use the new types table
-- First, add the new foreign key column (nullable for now)
ALTER TABLE public.discoveries ADD COLUMN type_id bigint;

-- Add the foreign key constraint
ALTER TABLE public.discoveries ADD CONSTRAINT discoveries_type_id_fkey FOREIGN KEY (type_id) REFERENCES public.discovery_types(id);

-- Update the new column based on the old text column
UPDATE public.discoveries d
SET type_id = (SELECT id FROM public.discovery_types dt WHERE dt.name = d.type);

-- Now that data is migrated, we can remove the old column and make the new one NOT NULL
ALTER TABLE public.discoveries DROP COLUMN type;
ALTER TABLE public.discoveries RENAME COLUMN type_id TO type;
ALTER TABLE public.discoveries ALTER COLUMN type SET NOT NULL;
