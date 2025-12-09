# Multi-Branch Migration Risk Analysis

## ⚠️ CRITICAL ASSESSMENT

**TL;DR: This is a HIGH-RISK migration that WILL break things if not done carefully. However, it's manageable with a phased approach.**

---

## 🔴 WHAT WILL DEFINITELY BREAK

### 1. **Database Schema Changes**
- **Unique Constraints**: Currently `opening_stock` and `closing_stock` have `UNIQUE(item_id, date, organization_id)`. Adding `branch_id` will require:
  - Dropping existing constraints
  - Creating new ones: `UNIQUE(item_id, date, organization_id, branch_id)`
  - **RISK**: Existing data will need default branch assignment or migration

- **Foreign Keys**: All tables with `organization_id` will need `branch_id` added
  - `items`, `sales`, `opening_stock`, `closing_stock`, `restocking`, `expenses`, `waste_spoilage`
  - **RISK**: Foreign key constraints will fail if `branch_id` is NOT NULL without default values

### 2. **API Routes (83+ occurrences of organization_id)**
Every API route currently filters by `organization_id`. Adding `branch_id` means:
- **ALL** API routes need updating
- Query logic changes from: `WHERE organization_id = X`
- To: `WHERE organization_id = X AND branch_id = Y`
- **RISK**: If branch_id is missing, queries will return empty results (breaking existing functionality)

### 3. **Zustand Stores**
All stores currently use `organizationId`:
- `itemsStore.fetchItems(organizationId)`
- `salesStore.fetchSales(date, organizationId)`
- `stockStore.fetchOpeningStock(date, organizationId)`
- **RISK**: Store methods need `branchId` parameter, breaking all components using them

### 4. **Stock Calculation Logic**
The complex cascading stock calculation in `lib/stock-cascade.ts`:
- Currently calculates: `Opening + Restocking - Sales - Waste`
- With branches: Must calculate PER BRANCH
- **RISK**: Stock calculations will be wrong if branch_id is not properly passed through

### 5. **RLS Policies**
Current RLS policies filter by `organization_id`. Need to add `branch_id` filtering:
- **RISK**: Users might see data from wrong branches or no data at all

### 6. **Role System**
Current: `'admin' | 'staff' | 'superadmin'`
Proposed: `'tenant_admin' | 'branch_manager' | 'staff'`
- **RISK**: All role checks throughout the codebase will break
- Components check `isAdmin`, `isStaff` - these need to change

---

## 🟡 WHAT NEEDS CAREFUL MIGRATION

### 1. **Existing Data**
- All existing records have `organization_id` but NO `branch_id`
- Need migration strategy:
  - Option A: Create default "Main Branch" for each organization
  - Option B: Make `branch_id` nullable initially (NOT recommended - breaks queries)
  - **RECOMMENDED**: Option A with migration script

### 2. **Component Updates**
- `SalesForm.tsx` - Uses `organizationId` from `useAuth()`
- `DashboardStatsCards.tsx` - Filters by `organizationId`
- `RestockingForm.tsx` - Uses `organizationId`
- All components need `branchId` context

### 3. **Type Definitions**
- `types/database.ts` - All interfaces need `branch_id?: string | null`
- TypeScript will catch missing fields, but requires updates everywhere

### 4. **Middleware**
- Current middleware checks organization access
- Need branch access checks
- Branch switching logic for tenant admins

---

## 🟢 WHAT WON'T BREAK (If Done Right)

### 1. **Core Business Logic**
- Stock calculation formulas remain the same
- Just need to apply per-branch

### 2. **UI Components**
- Most components just need additional filtering
- No complete rewrites needed

### 3. **Export/Reporting**
- Same logic, just add branch filtering

---

## 📋 RECOMMENDED MIGRATION STRATEGY

### Phase 1: Database Preparation (SAFE)
1. Add `branches` table
2. Create default "Main Branch" for each existing organization
3. Add `branch_id` column to all tables (NULLABLE initially)
4. Migrate existing data: Set `branch_id = default_branch_id` for all records
5. Make `branch_id` NOT NULL after migration

### Phase 2: Backend Updates (MEDIUM RISK)
1. Update API routes to accept `branch_id` (optional initially)
2. Add branch filtering alongside organization filtering
3. Update RLS policies to include branch_id
4. Test all API endpoints

### Phase 3: Frontend Updates (MEDIUM RISK)
1. Add branch context/store
2. Update Zustand stores to include `branchId`
3. Update components one by one
4. Add branch selector UI (admin only)

### Phase 4: Role System (HIGH RISK)
1. Add new role enum values
2. Map existing roles:
   - `superadmin` → `tenant_admin`
   - `admin` → `branch_manager` (with default branch)
   - `staff` → `staff` (with default branch)
3. Update all role checks

### Phase 5: New Features (LOW RISK)
1. Add branch transfers
2. Add supplier management
3. Add POS features

---

## 🛡️ SAFEGUARDS TO PREVENT BREAKAGE

### 1. **Backward Compatibility**
- Keep `organization_id` filtering active
- Add `branch_id` as additional filter (AND condition)
- This ensures existing queries still work

### 2. **Default Branch Strategy**
- Every organization MUST have at least one branch
- Auto-create "Main Branch" on organization creation
- Existing organizations get default branch via migration

### 3. **Gradual Rollout**
- Deploy database changes first (with nullable branch_id)
- Migrate data
- Then update code incrementally
- Test each component before moving to next

### 4. **Feature Flags**
- Add feature flag for multi-branch support
- Can disable if issues arise
- Single-branch mode as fallback

---

## ⚡ CRITICAL DECISIONS NEEDED

### 1. **Branch ID in Queries**
**Question**: Should `branch_id` be required or optional?
- **Required**: Cleaner, but breaks existing code
- **Optional**: Backward compatible, but allows bugs
- **RECOMMENDED**: Required, but with default branch migration

### 2. **Role Migration**
**Question**: How to map existing roles?
- **Option A**: Keep old roles, add new ones
- **Option B**: Migrate all to new roles
- **RECOMMENDED**: Option B with migration script

### 3. **Branch Switching**
**Question**: How to handle branch context?
- **Option A**: URL parameter (`?branch=xxx`)
- **Option B**: Zustand store
- **Option C**: Cookie/localStorage
- **RECOMMENDED**: Zustand store + URL parameter

---

## 🎯 RECOMMENDED APPROACH

### Step 1: Create Migration Script
```sql
-- 1. Create branches table
-- 2. Create default branch for each organization
-- 3. Add branch_id columns (nullable)
-- 4. Migrate data: UPDATE all tables SET branch_id = default_branch_id
-- 5. Make branch_id NOT NULL
-- 6. Update unique constraints
```

### Step 2: Update Types
- Add `branch_id` to all interfaces
- Add `Branch` interface
- Update `UserRole` type

### Step 3: Create Branch Store
- Similar to `organizationStore`
- Manages current branch context
- Auto-selects default branch for non-admins

### Step 4: Update API Routes (One at a time)
- Start with read-only routes (GET)
- Then write routes (POST/PUT/DELETE)
- Test each thoroughly

### Step 5: Update Components
- Start with simple components
- Update complex ones last (SalesForm, etc.)

---

## ⚠️ RED FLAGS TO WATCH FOR

1. **Empty Results**: If branch_id filtering is too strict
2. **Duplicate Records**: If unique constraints aren't updated
3. **Permission Errors**: If RLS policies block legitimate access
4. **Stock Calculation Errors**: If branch_id missing in calculations
5. **Type Errors**: If TypeScript interfaces don't match database

---

## ✅ SUCCESS CRITERIA

- [ ] All existing data migrated to default branches
- [ ] All API routes work with branch_id
- [ ] All components filter by branch correctly
- [ ] Stock calculations work per-branch
- [ ] Role system updated and working
- [ ] Branch switching works for tenant admins
- [ ] No data loss or corruption
- [ ] All existing features still work

---

## 🚨 FINAL VERDICT

**This migration is HIGH RISK but MANAGEABLE** if done in phases with proper testing.

**Key Success Factors:**
1. ✅ Comprehensive migration script for existing data
2. ✅ Backward compatibility during transition
3. ✅ Incremental updates (not big bang)
4. ✅ Extensive testing at each phase
5. ✅ Rollback plan if issues arise

**Estimated Time**: 2-3 weeks for safe migration
**Risk Level**: HIGH (but manageable with phased approach)
**Recommendation**: Proceed, but with careful planning and testing

