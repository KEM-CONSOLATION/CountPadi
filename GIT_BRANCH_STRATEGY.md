# Git Branch Strategy for Multi-Branch Feature

## Recommended Approach

### 1. Create Feature Branch

```bash
# Make sure current changes are committed
git add .
git commit -m "feat: add Zustand stores, cookie management, and Prettier"

# Create and switch to new feature branch
git checkout -b feature/multi-branch-support

# Push to remote (optional, for backup)
git push -u origin feature/multi-branch-support
```

### 2. Work on Feature Branch

- All multi-branch work happens on `feature/multi-branch-support`
- Main branch stays stable
- Can merge back when ready

### 3. Merge Strategy

When ready to merge:

```bash
# Switch back to main
git checkout main

# Merge feature branch
git merge feature/multi-branch-support

# Or use pull request for code review
```

---

## Database Migration Strategy

### Option 1: Supabase Migration Files (RECOMMENDED)

Create migration files that can be tested separately:

```sql
-- supabase/migrations/20250109_add_branches.sql
-- This file can be tested in a separate Supabase project first
```

**Advantages:**

- Can test in staging/development Supabase project
- Reversible (can create rollback migrations)
- Version controlled
- Can apply when ready

### Option 2: Feature Flag in Database

Add a feature flag to control multi-branch:

```sql
-- Add to organizations table
ALTER TABLE organizations ADD COLUMN multi_branch_enabled BOOLEAN DEFAULT false;
```

Then in code:

```typescript
if (organization.multi_branch_enabled) {
  // Use branch-aware queries
} else {
  // Use current organization-only queries
}
```

**Advantages:**

- Can enable per organization
- Gradual rollout
- Easy to disable if issues

### Option 3: Separate Database Schema

Create new tables with `_v2` suffix:

- `branches_v2`
- `branch_inventory_v2`
- etc.

Then migrate data when ready.

---

## Recommended Database Strategy

### Phase 1: Add Tables (Non-Breaking)

```sql
-- These tables are NEW, don't affect existing tables
CREATE TABLE branches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id),
  name TEXT NOT NULL,
  address TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Add branch_id columns as NULLABLE first
ALTER TABLE items ADD COLUMN branch_id UUID REFERENCES branches(id);
ALTER TABLE sales ADD COLUMN branch_id UUID REFERENCES branches(id);
-- etc.
```

**Why this is safe:**

- Existing queries still work (branch_id is NULL)
- No data loss
- Can test new features without breaking old ones

### Phase 2: Migrate Data

```sql
-- Create default branch for each organization
INSERT INTO branches (organization_id, name)
SELECT id, name || ' - Main Branch' FROM organizations;

-- Update existing data to use default branch
UPDATE items SET branch_id = (
  SELECT id FROM branches WHERE organization_id = items.organization_id LIMIT 1
) WHERE branch_id IS NULL;
```

### Phase 3: Make Required

```sql
-- After migration is complete
ALTER TABLE items ALTER COLUMN branch_id SET NOT NULL;
-- etc.
```

---

## Testing Strategy

### 1. Local Development

- Test all changes locally
- Use local Supabase instance or separate project

### 2. Staging Environment

- Create separate Supabase project for staging
- Test migrations there first
- Verify all features work

### 3. Production Rollout

- Apply migrations during low-traffic period
- Have rollback plan ready
- Monitor for issues

---

## Protection Mechanisms

### 1. Database Backups

```bash
# Before any migration
# Use Supabase dashboard to create backup
# Or use pg_dump
```

### 2. Migration Rollback Scripts

```sql
-- supabase/migrations/rollback/20250109_rollback_branches.sql
-- Script to undo changes if needed
```

### 3. Feature Flags

- Use code-level feature flags
- Can disable multi-branch without database changes

### 4. Gradual Rollout

- Enable for one organization first
- Test thoroughly
- Then enable for all

---

## Best Practices

1. **Never modify production directly**
   - Always test in staging first
   - Use migration files, not manual SQL

2. **Version control migrations**
   - All SQL in `supabase/migrations/`
   - Descriptive names with dates
   - Include rollback scripts

3. **Backup before migration**
   - Always backup production before major changes
   - Test restore process

4. **Monitor after deployment**
   - Watch for errors
   - Monitor query performance
   - Check data integrity

5. **Have rollback plan**
   - Know how to undo changes
   - Test rollback in staging

---

## Recommended Workflow

```bash
# 1. Create feature branch
git checkout -b feature/multi-branch-support

# 2. Create migration files (don't run yet)
# supabase/migrations/20250109_add_branches.sql

# 3. Test in local/staging Supabase project
# Apply migration to test database

# 4. Update code to use branches
# All code changes in feature branch

# 5. Test thoroughly
# Verify nothing breaks

# 6. When ready, merge to main
git checkout main
git merge feature/multi-branch-support

# 7. Apply migrations to production
# Run migration files in Supabase dashboard
```

---

## Tour Guide Recommendation

**Do the tour guide NOW** (before multi-branch):

**Why:**

- ✅ Tour guide is UI-only, no database changes
- ✅ Won't conflict with multi-branch work
- ✅ Improves UX immediately
- ✅ Can be done in parallel
- ✅ Independent feature

**Implementation:**

- Use a library like `react-joyride` or `intro.js`
- No database changes needed
- Can be feature-flagged
- Easy to update later

**Timeline:**

1. Now: Implement tour guide (1-2 days)
2. Then: Multi-branch feature (2-3 weeks)

This way users get immediate value while you work on multi-branch.
