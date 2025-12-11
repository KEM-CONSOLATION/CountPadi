-- Check if organizations have subdomains set
-- Run this in Supabase SQL Editor to verify your setup

-- 1. List all organizations and their subdomains
SELECT 
  id,
  name,
  subdomain,
  CASE 
    WHEN subdomain IS NULL THEN '❌ Not set'
    ELSE '✅ Set'
  END as status
FROM public.organizations
ORDER BY created_at DESC;

-- 2. Check if a specific subdomain exists
-- Replace 'lacuisine' with your subdomain
SELECT 
  id,
  name,
  subdomain
FROM public.organizations
WHERE subdomain = 'lacuisine';

-- 3. Set subdomain for an organization (if needed)
-- Replace 'YOUR_ORG_ID' with your organization ID
-- Replace 'lacuisine' with your desired subdomain
/*
UPDATE public.organizations
SET subdomain = 'lacuisine'
WHERE id = 'YOUR_ORG_ID';
*/

-- 4. Find organization ID by name
-- Replace 'Your Organization Name' with your actual organization name
SELECT 
  id,
  name,
  subdomain
FROM public.organizations
WHERE LOWER(name) LIKE LOWER('%Your Organization Name%');

