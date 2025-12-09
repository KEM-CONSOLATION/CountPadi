# Database Migration Safety Guide

## How to Prevent Database Changes from Affecting Production

### Strategy 1: Supabase Migration Files (RECOMMENDED)

Supabase migrations are **version-controlled SQL files** that can be:
- Tested in separate projects
- Applied when ready
- Rolled back if needed

#### Step 1: Create Migration Files (Don't Run Yet)

```sql
-- supabase/migrations/20250109_001_add_branches_table.sql
-- This file is just code, doesn't affect database until you run it

CREATE TABLE IF NOT EXISTS branches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_branches_organization ON branches(organization_id);
```

#### Step 2: Test in Separate Supabase Project

1. Create a **new Supabase project** (free tier is fine)
2. Copy your current schema to it
3. Apply migration files to test project
4. Test all functionality
5. Verify nothing breaks

#### Step 3: Apply to Production When Ready

Only when you're confident:
1. Run migration in production Supabase dashboard
2. Or use Supabase CLI: `supabase db push`

**Key Point**: Migration files are just code until you run them!

---

### Strategy 2: Feature Flag in Code

Add feature flag to control multi-branch without database changes:

```typescript
// lib/feature-flags.ts
export const FEATURES = {
  MULTI_BRANCH: process.env.NEXT_PUBLIC_ENABLE_MULTI_BRANCH === 'true',
} as const
```

Then in code:
```typescript
if (FEATURES.MULTI_BRANCH) {
  // Use branch-aware queries
} else {
  // Use current organization-only queries
}
```

**Advantages:**
- Can enable/disable without code changes
- Gradual rollout
- Easy to disable if issues

---

### Strategy 3: Nullable Columns First

Add `branch_id` columns as **NULLABLE** initially:

```sql
-- Safe: Doesn't break existing queries
ALTER TABLE items ADD COLUMN branch_id UUID REFERENCES branches(id);

-- Existing queries still work (branch_id is NULL)
-- New code can use branch_id when ready
```

Then later, after migration:
```sql
-- Make required after all data is migrated
ALTER TABLE items ALTER COLUMN branch_id SET NOT NULL;
```

---

### Strategy 4: Separate Tables (Safest)

Create new tables with different names:

```sql
-- New tables, don't touch old ones
CREATE TABLE branch_inventory (
  -- new structure
);

CREATE TABLE branch_sales (
  -- new structure
);
```

Then migrate data when ready:
```sql
INSERT INTO branch_sales 
SELECT *, branch_id FROM sales 
WHERE branch_id IS NOT NULL;
```

**Advantages:**
- Zero risk to existing data
- Can test fully before migration
- Easy rollback (just don't use new tables)

---

## Recommended Approach

### Phase 1: Preparation (No Production Changes)

1. **Create migration files** (just code, not run)
2. **Test in separate Supabase project**
3. **Update code in feature branch**
4. **Test everything locally**

### Phase 2: Staging Deployment

1. **Apply migrations to staging Supabase project**
2. **Deploy code to staging environment**
3. **Test thoroughly**
4. **Fix any issues**

### Phase 3: Production Rollout

1. **Backup production database**
2. **Apply migrations during low-traffic period**
3. **Deploy code**
4. **Monitor closely**
5. **Have rollback plan ready**

---

## Protection Checklist

Before any production migration:

- [ ] Migration files tested in separate project
- [ ] Code tested with new schema
- [ ] Backup created
- [ ] Rollback script prepared
- [ ] Low-traffic window scheduled
- [ ] Monitoring in place
- [ ] Team notified
- [ ] Rollback plan documented

---

## Rollback Plan

### If Migration Fails

1. **Stop deployment immediately**
2. **Run rollback script** (if prepared)
3. **Restore from backup** (if needed)
4. **Revert code changes**

### Rollback Script Example

```sql
-- supabase/migrations/rollback/20250109_rollback_branches.sql

-- Remove branch_id columns
ALTER TABLE items DROP COLUMN IF EXISTS branch_id;
ALTER TABLE sales DROP COLUMN IF EXISTS branch_id;
-- etc.

-- Drop branches table
DROP TABLE IF EXISTS branches CASCADE;
```

---

## Best Practices

1. **Never modify production directly**
   - Always use migration files
   - Test in staging first

2. **Version control everything**
   - All SQL in migration files
   - Track in git

3. **Backup before migration**
   - Use Supabase dashboard backup
   - Or pg_dump

4. **Test thoroughly**
   - Separate test database
   - All features work
   - No data loss

5. **Gradual rollout**
   - Enable for one organization first
   - Monitor closely
   - Then enable for all

---

## Summary

**Your database is SAFE if you:**
1. ✅ Create migration files (just code, not run)
2. ✅ Test in separate Supabase project
3. ✅ Only apply to production when ready
4. ✅ Have backup and rollback plan

**Migration files are just SQL code** - they don't affect your database until you explicitly run them in Supabase dashboard or via CLI.

