-- Add quantity column to items table (as INTEGER for whole numbers)
ALTER TABLE public.items 
ADD COLUMN IF NOT EXISTS quantity INTEGER NOT NULL DEFAULT 0;

-- Update existing items to have quantity 0 if they don't have one
UPDATE public.items 
SET quantity = 0 
WHERE quantity IS NULL;

