-- Add price fields to items and sales tables

-- Add price_per_unit to items table
ALTER TABLE public.items 
ADD COLUMN IF NOT EXISTS price_per_unit DECIMAL(10, 2) NOT NULL DEFAULT 0;

-- Add price fields to sales table
ALTER TABLE public.sales 
ADD COLUMN IF NOT EXISTS price_per_unit DECIMAL(10, 2) NOT NULL DEFAULT 0;

ALTER TABLE public.sales 
ADD COLUMN IF NOT EXISTS total_price DECIMAL(10, 2) NOT NULL DEFAULT 0;

-- Update existing sales records to have price 0 (can be updated manually if needed)
UPDATE public.sales 
SET price_per_unit = 0, total_price = 0 
WHERE price_per_unit IS NULL OR total_price IS NULL;

