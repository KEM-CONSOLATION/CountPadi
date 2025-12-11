# Testing Subdomains Locally

This guide shows you how to test the subdomain feature on your local machine before deploying.

## Method 1: Using /etc/hosts (Recommended)

### Step 1: Edit your hosts file

**On macOS/Linux:**

```bash
sudo nano /etc/hosts
```

**On Windows:**

1. Open Notepad as Administrator
2. Open file: `C:\Windows\System32\drivers\etc\hosts`

### Step 2: Add local subdomain entries

Add these lines to your hosts file:

```
127.0.0.1       localhost
127.0.0.1       lacuisine.localhost
127.0.0.1       testorg.localhost
127.0.0.1       demo.localhost
```

**Note:** You can add as many subdomains as you need for testing. Replace `lacuisine`, `testorg`, `demo` with your organization subdomains.

### Step 3: Update middleware for localhost testing

The middleware currently skips localhost subdomains. We need to update it to allow local testing.

### Step 4: Start your Next.js dev server

```bash
npm run dev
# or
yarn dev
```

### Step 5: Access via subdomain

Open your browser and visit:

- `http://lacuisine.localhost:3000` (or whatever port Next.js uses)
- `http://testorg.localhost:3000`
- `http://demo.localhost:3000`

## Method 2: Using localhost subdomains (Alternative)

Some browsers support `*.localhost` subdomains automatically. Try:

- `http://lacuisine.localhost:3000`
- `http://testorg.localhost:3000`

If this doesn't work, use Method 1.

## Method 3: Using a local domain (Advanced)

You can set up a local domain like `countpadi.local`:

### Step 1: Add to hosts file

```
127.0.0.1       countpadi.local
127.0.0.1       lacuisine.countpadi.local
127.0.0.1       testorg.countpadi.local
```

### Step 2: Access via

- `http://lacuisine.countpadi.local:3000`
- `http://testorg.countpadi.local:3000`

## Testing Checklist

1. ✅ **Login Page Customization**
   - Visit `http://lacuisine.localhost:3000/login`
   - Should show organization logo (if set)
   - Should show organization brand color
   - Should show organization name
   - Should show "lacuisine.localhost · Powered by CountPadi" in footer

2. ✅ **Dashboard Footer**
   - Login and navigate to dashboard
   - Footer should show subdomain with "Powered by CountPadi"

3. ✅ **Subdomain Detection**
   - Check browser console for any errors
   - Verify organization data is fetched correctly

4. ✅ **Fallback Behavior**
   - Visit `http://localhost:3000` (no subdomain)
   - Should show default CountPadi branding
   - Should show "Powered by CountPadi" (no subdomain)

## Troubleshooting

### Subdomain not working?

1. Clear browser cache
2. Restart your dev server
3. Check hosts file syntax (no extra spaces)
4. Try incognito/private browsing mode

### Organization not found?

1. Make sure you've run the migration: `supabase/migrations/20250212_001_add_subdomain_to_organizations.sql`
2. Set subdomain in SuperAdmin for your test organization
3. Check that subdomain matches exactly (case-sensitive in database, but middleware converts to lowercase)

### Port issues?

- If Next.js runs on port 3001, use `http://lacuisine.localhost:3001`
- Check your terminal for the actual port number

## Quick Test Script

Create a test organization:

1. Login as superadmin
2. Create organization with name "La Cuisine"
3. Set subdomain to "lacuisine"
4. Add logo and brand color
5. Visit `http://lacuisine.localhost:3000/login`
6. Should see customized login page!

## Notes

- The middleware currently skips `localhost` subdomains for production safety
- For local testing, we'll update the middleware to allow `*.localhost` subdomains
- In production, this won't affect real subdomains like `lacuisine.countpadi.com`
