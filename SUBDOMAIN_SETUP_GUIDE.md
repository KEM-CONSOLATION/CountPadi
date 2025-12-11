# Subdomain Setup Guide for CountPadi

This guide explains how to set up subdomain routing so each organization gets its own subdomain like `lacuisine.countpadi.com`.

---

## Overview

The subdomain setup allows:
- Each organization to have a custom subdomain (e.g., `lacuisine.countpadi.com`)
- Automatic organization detection based on subdomain
- Seamless user experience with branded URLs

---

## Step 1: Database Migration

Add a `subdomain` field to the organizations table.

### Create Migration File

Create: `supabase/migrations/20250212_001_add_subdomain_to_organizations.sql`

```sql
-- Add subdomain column to organizations table
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS subdomain TEXT UNIQUE;

-- Create index for faster subdomain lookups
CREATE INDEX IF NOT EXISTS idx_organizations_subdomain ON public.organizations(subdomain) WHERE subdomain IS NOT NULL;

-- Add comment
COMMENT ON COLUMN public.organizations.subdomain IS 'Unique subdomain for this organization (e.g., "lacuisine" for lacuisine.countpadi.com)';
```

### Update TypeScript Types

Update `types/database.ts`:

```typescript
export interface Organization {
  id: string
  name: string
  slug: string
  created_by: string | null
  created_at: string
  updated_at: string
  logo_url?: string | null
  brand_color?: string | null
  business_type?: string | null
  opening_time?: string | null
  closing_time?: string | null
  subdomain?: string | null  // Add this
}
```

---

## Step 2: Update Organization Creation/Update APIs

### Update `/app/api/organizations/create/route.ts`

Add subdomain validation and storage:

```typescript
// In the POST handler, after slug generation:
const { name, user_id, business_type, subdomain } = body

// Validate subdomain format
if (subdomain) {
  const subdomainRegex = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/
  if (!subdomainRegex.test(subdomain)) {
    return NextResponse.json(
      { error: 'Invalid subdomain format. Use lowercase letters, numbers, and hyphens only.' },
      { status: 400 }
    )
  }
  
  // Check if subdomain already exists
  const { data: existing } = await supabaseAdmin
    .from('organizations')
    .select('id')
    .eq('subdomain', subdomain)
    .single()
    
  if (existing) {
    return NextResponse.json(
      { error: 'Subdomain already taken' },
      { status: 400 }
    )
  }
}

// In the insert:
const { data: organization, error: orgError } = await supabaseAdmin
  .from('organizations')
  .insert({
    name,
    slug,
    created_by: user_id,
    business_type: business_type || null,
    subdomain: subdomain || null,  // Add this
  })
  .select()
  .single()
```

### Update `/app/api/organizations/update/route.ts`

Add subdomain update logic:

```typescript
// In the PUT handler:
const { organization_id, name, logo_url, brand_color, business_type, opening_time, closing_time, subdomain } = body

// Validate subdomain if provided
if (subdomain !== undefined) {
  if (subdomain && subdomain.trim() !== '') {
    const subdomainRegex = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/
    if (!subdomainRegex.test(subdomain)) {
      return NextResponse.json(
        { error: 'Invalid subdomain format. Use lowercase letters, numbers, and hyphens only.' },
        { status: 400 }
      )
    }
    
    // Check if subdomain is taken by another organization
    const { data: existing } = await supabaseAdmin
      .from('organizations')
      .select('id')
      .eq('subdomain', subdomain)
      .neq('id', organization_id)
      .single()
      
    if (existing) {
      return NextResponse.json(
        { error: 'Subdomain already taken' },
        { status: 400 }
      )
    }
    updateData.subdomain = subdomain
  } else {
    updateData.subdomain = null
  }
}
```

---

## Step 3: Update Middleware for Subdomain Detection

Update `middleware.ts` to detect subdomain and set organization context:

```typescript
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Get subdomain from hostname
function getSubdomain(hostname: string): string | null {
  // Remove port if present
  const host = hostname.split(':')[0]
  
  // For localhost, return null (use default behavior)
  if (host === 'localhost' || host === '127.0.0.1') {
    return null
  }
  
  // Split by dots
  const parts = host.split('.')
  
  // If we have at least 3 parts (subdomain.domain.tld), extract subdomain
  if (parts.length >= 3) {
    return parts[0]
  }
  
  return null
}

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || ''
  const subdomain = getSubdomain(hostname)
  
  // If subdomain exists, look up organization
  if (subdomain) {
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
    
    const { data: organization } = await supabaseAdmin
      .from('organizations')
      .select('id, name, subdomain')
      .eq('subdomain', subdomain)
      .single()
    
    if (organization) {
      // Set organization ID in headers for use in pages
      const requestHeaders = new Headers(request.headers)
      requestHeaders.set('x-organization-id', organization.id)
      requestHeaders.set('x-organization-subdomain', subdomain)
      
      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      })
    } else {
      // Subdomain not found - redirect to main domain or show error
      const url = request.nextUrl.clone()
      url.hostname = 'countpadi.com' // Your main domain
      return NextResponse.redirect(url)
    }
  }
  
  // No subdomain - continue with normal flow
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
```

---

## Step 4: Update Organization Detection in Components

Update components to use subdomain-based organization detection when available:

### Update `lib/stores/organizationStore.ts`

```typescript
initialize: async (organizationId: string | null) => {
  // First, try to get organization from subdomain (if in browser)
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname
    const subdomain = getSubdomain(hostname)
    
    if (subdomain) {
      // Fetch organization by subdomain
      const { supabase } = await import('@/lib/supabase/client')
      const { data: orgBySubdomain } = await supabase
        .from('organizations')
        .select('*')
        .eq('subdomain', subdomain)
        .single()
        
      if (orgBySubdomain) {
        set({
          organization: orgBySubdomain,
          loading: false,
          initialized: true,
        })
        return
      }
    }
  }
  
  // Fallback to organizationId from user profile
  if (!organizationId) {
    set({ organization: null, loading: false, initialized: true })
    return
  }
  
  // ... rest of existing code
}
```

---

## Step 5: Update SuperAdmin View

Add subdomain field to organization creation/editing in `components/SuperAdminView.tsx`:

```typescript
// In the create organization form:
const [newOrg, setNewOrg] = useState({
  name: '',
  business_type: '',
  subdomain: '',  // Add this
  adminEmail: '',
  adminPassword: '',
  adminName: '',
})

// In the form JSX:
<div>
  <label htmlFor="subdomain" className="block text-sm font-medium text-gray-700 mb-2">
    Subdomain (Optional)
  </label>
  <input
    id="subdomain"
    type="text"
    value={newOrg.subdomain}
    onChange={e => {
      const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')
      setNewOrg({ ...newOrg, subdomain: value })
    }}
    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
    placeholder="lacuisine"
  />
  <p className="mt-1 text-xs text-gray-500">
    Optional: Custom subdomain (e.g., "lacuisine" for lacuisine.countpadi.com)
  </p>
</div>

// In the update organization section:
{editingOrg === org.id && (
  <div className="mt-4 space-y-4">
    {/* ... existing fields ... */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Subdomain
      </label>
      <input
        type="text"
        value={editingData.subdomain || ''}
        onChange={e => {
          const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')
          setEditingData({ ...editingData, subdomain: value })
        }}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        placeholder="lacuisine"
      />
      <p className="mt-1 text-xs text-gray-500">
        Custom subdomain (e.g., "lacuisine" for lacuisine.countpadi.com)
      </p>
    </div>
  </div>
)}
```

---

## Step 6: DNS Configuration

### Option A: Wildcard DNS (Recommended)

Set up a wildcard DNS record that points all subdomains to your server:

```
Type: A (or CNAME)
Name: *
Value: Your server IP (or CNAME target)
TTL: 3600
```

**For Vercel:**
- Go to your domain settings in Vercel
- Add `*.countpadi.com` as a domain
- Vercel will automatically handle all subdomains

**For other providers:**
- Add a wildcard A record: `*.countpadi.com` → Your server IP
- Or CNAME: `*.countpadi.com` → Your server hostname

### Option B: Individual Subdomain Records

For each organization, add a DNS record:

```
Type: A (or CNAME)
Name: lacuisine
Value: Your server IP (or CNAME target)
TTL: 3600
```

This is less scalable but gives you more control.

---

## Step 7: SSL Certificate Setup

### For Vercel:
Vercel automatically provisions SSL certificates for all subdomains when you add the wildcard domain.

### For Custom Server:
You'll need a wildcard SSL certificate:
- **Let's Encrypt**: Use certbot with DNS challenge for wildcard certificates
- **Cloudflare**: Free SSL for all subdomains if you use Cloudflare DNS
- **Commercial**: Purchase a wildcard SSL certificate

Example with Let's Encrypt:
```bash
certbot certonly --manual --preferred-challenges dns -d *.countpadi.com -d countpadi.com
```

---

## Step 8: Environment Variables

Update your `.env.local` and production environment:

```env
# No new variables needed - existing ones work
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_key
```

---

## Step 9: Testing

### Local Testing

1. **Update `/etc/hosts` (Mac/Linux) or `C:\Windows\System32\drivers\etc\hosts` (Windows):**
   ```
   127.0.0.1 lacuisine.localhost
   127.0.0.1 testorg.localhost
   ```

2. **Access via:**
   - `http://lacuisine.localhost:3000`
   - `http://testorg.localhost:3000`

### Production Testing

1. Create an organization with subdomain "lacuisine"
2. Access `https://lacuisine.countpadi.com`
3. Verify organization loads correctly

---

## Step 10: Deployment Considerations

### Vercel Deployment

1. Add wildcard domain in Vercel dashboard
2. Update DNS to point `*.countpadi.com` to Vercel
3. Deploy your code
4. Vercel handles SSL automatically

### Custom Server Deployment

1. Set up wildcard DNS
2. Configure Nginx/Apache for subdomain routing
3. Install wildcard SSL certificate
4. Deploy Next.js app
5. Configure reverse proxy to forward all subdomains to Next.js

**Nginx Example:**
```nginx
server {
    listen 80;
    server_name *.countpadi.com countpadi.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name *.countpadi.com countpadi.com;
    
    ssl_certificate /path/to/wildcard.crt;
    ssl_certificate_key /path/to/wildcard.key;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## Security Considerations

1. **Subdomain Validation**: Always validate subdomain format (lowercase, alphanumeric, hyphens only)
2. **Subdomain Uniqueness**: Enforce unique subdomains in database
3. **Reserved Subdomains**: Block reserved subdomains like `www`, `api`, `admin`, `mail`, etc.
4. **Rate Limiting**: Apply rate limiting to subdomain creation
5. **Organization Isolation**: Ensure RLS policies still work correctly with subdomain routing

---

## Troubleshooting

### Subdomain Not Working
- Check DNS propagation: `dig lacuisine.countpadi.com`
- Verify SSL certificate includes wildcard
- Check middleware is running correctly
- Verify organization has subdomain set in database

### Organization Not Found
- Check subdomain spelling matches database
- Verify organization has `subdomain` field populated
- Check middleware logs for errors

### SSL Certificate Issues
- Ensure wildcard certificate is installed
- Verify certificate includes `*.countpadi.com`
- Check certificate expiration date

---

## Next Steps

1. Run the database migration
2. Update TypeScript types
3. Update API routes
4. Update middleware
5. Update SuperAdmin UI
6. Configure DNS
7. Set up SSL
8. Test locally
9. Deploy to production

---

## Additional Features (Optional)

### Custom Domain Support
Allow organizations to use their own domain (e.g., `app.lacuisine.com`):
- Add `custom_domain` field to organizations
- Update DNS validation
- Handle domain verification

### Subdomain Suggestions
Auto-generate subdomain suggestions from organization name:
```typescript
function generateSubdomain(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 63)
}
```

