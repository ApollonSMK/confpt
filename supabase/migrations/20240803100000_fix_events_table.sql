-- Make optional text fields in the events table nullable and set their default to NULL.
-- This prevents database errors when the form submits empty strings for these fields.

-- Allow description to be null
ALTER TABLE public.events
ALTER COLUMN description DROP NOT NULL,
ALTER COLUMN description SET DEFAULT NULL;

-- Allow location to be null
ALTER TABLE public.events
ALTER COLUMN location DROP NOT NULL,
ALTER COLUMN location SET DEFAULT NULL;

-- Allow municipality to be null
ALTER TABLE public.events
ALTER COLUMN municipality DROP NOT NULL,
ALTER COLUMN municipality SET DEFAULT NULL;

-- Allow image_url to be null
ALTER TABLE public.events
ALTER COLUMN image_url DROP NOT NULL,
ALTER COLUMN image_url SET DEFAULT NULL;

-- Allow image_hint to be null
ALTER TABLE public.events
ALTER COLUMN image_hint DROP NOT NULL,
ALTER COLUMN image_hint SET DEFAULT NULL;

    