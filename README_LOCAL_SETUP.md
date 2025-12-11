# Local Subdomain Setup for macOS

## Quick Setup

Run the setup script:

```bash
./setup-local-subdomains.sh
```

This will add the following entries to your `/etc/hosts` file:
- `lacuisine.localhost`
- `testorg.localhost`
- `demo.localhost`

## Manual Setup (Alternative)

If you prefer to do it manually:

1. Open Terminal
2. Run: `sudo nano /etc/hosts`
3. Add these lines at the end:
   ```
   127.0.0.1       lacuisine.localhost
   127.0.0.1       testorg.localhost
   127.0.0.1       demo.localhost
   ```
4. Save (Ctrl+O, Enter, Ctrl+X)

## Testing

1. Make sure you've run the migration: `supabase/migrations/20250212_001_add_subdomain_to_organizations.sql`
2. Set subdomain in SuperAdmin for your test organization (e.g., "lacuisine")
3. Start your dev server: `npm run dev`
4. Visit: `http://lacuisine.localhost:3000/login`

## Removing Subdomains

To remove the entries later:
1. Run: `sudo nano /etc/hosts`
2. Find and delete the lines with `lacuisine.localhost`, `testorg.localhost`, `demo.localhost`
3. Save and exit

