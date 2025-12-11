-- Add subdomain column to organizations table
-- This is nullable and optional - existing organizations work without it
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS subdomain TEXT;

-- Create unique index for subdomain (only for non-null values)
-- This allows multiple NULL values but ensures uniqueness for set subdomains
CREATE UNIQUE INDEX IF NOT EXISTS idx_organizations_subdomain_unique 
  ON public.organizations(subdomain) 
  WHERE subdomain IS NOT NULL;

-- Create index for faster subdomain lookups
CREATE INDEX IF NOT EXISTS idx_organizations_subdomain 
  ON public.organizations(subdomain) 
  WHERE subdomain IS NOT NULL;

-- Add comment
COMMENT ON COLUMN public.organizations.subdomain IS 'Unique subdomain for this organization (e.g., "lacuisine" for lacuisine.countpadi.com). Optional - organization works without it.';

