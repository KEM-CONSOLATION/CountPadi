# Branch Filtering Implementation Guide

## Overview

This document outlines the branch filtering implementation to ensure all data is filtered by branch context, with admins seeing branch-specific data when they switch branches (except in management sections).

## Key Principles

### 1. Branch Context

- **Tenant Admins**: Can switch branches via BranchSelector. When switched, see only that branch's data.
- **Branch Managers/Staff**: Fixed branch_id from profile. Always see their branch's data.
- **Management Sections**: Show all data regardless of branch (UserManagement, BranchManagement, ItemManagement)

### 2. Branch Change Event

When admin switches branches, a `branchChanged` event is dispatched. Components should listen to this and refetch data.

```typescript
// In BranchSelector.tsx
window.dispatchEvent(
  new CustomEvent('branchChanged', {
    detail: { branchId: branch?.id || null, branchName: branch?.name || 'All Branches' },
  })
)
```

### 3. Helper Hook

Use `useBranchChangeListener` hook to listen for branch changes:

```typescript
import { useBranchChangeListener } from '@/lib/hooks/useBranchChangeListener'

const fetchData = useCallback(() => {
  // Fetch data with branchId from useAuth()
}, [branchId, organizationId])

useBranchChangeListener(() => {
  fetchData()
})
```

## Components Status

### ✅ Completed

- **BranchSelector**: Dispatches `branchChanged` event
- **DashboardStatsCards**: Uses branch filtering + listens to branch changes
- **SalesForm**: Uses branch filtering + listens to branch changes
- **SalesReports**: Uses branch filtering + listens to branch changes

### 🔄 In Progress / Needs Update

#### Data Components (Should Filter by Branch)

1. **DailyStockReport** - Opening/Closing Stock
   - Already uses branch_id parameter in API calls
   - Need to add branch change listener

2. **RestockingForm**
   - Already filters by branchId
   - Need to add branch change listener

3. **TransferForm**
   - Already filters by branchId
   - Need to add branch change listener

4. **WasteSpoilageForm**
   - Already filters by branchId
   - Need to add branch change listener

5. **ExpensesForm**
   - Need to add branch filtering + branch change listener

6. **IssuanceForm**
   - Need to add branch filtering + branch change listener

7. **ReturnsForm**
   - Need to add branch filtering + branch change listener

8. **HistoryView**
   - Need to add branch filtering + branch change listener

9. **InventoryValuation**
   - Need to add branch filtering + branch change listener

10. **ProfitLossStatsCards**
    - Need to add branch filtering + branch change listener

11. **ExpenseStatsCards**
    - Need to add branch filtering + branch change listener

12. **StaffPerformanceReports**
    - Already uses branchId in API calls
    - Need to add branch change listener

13. **TopItemsChart**
    - Need to add branch filtering + branch change listener

14. **SalesTrendChart**
    - Need to add branch filtering + branch change listener

#### Management Components (Should Show All Data)

1. **UserManagement** ✅ - Should show all users (no branch filter)
2. **BranchManagement** ✅ - Should show all branches (no branch filter)
3. **ItemManagement** ⚠️ - Currently filters by branch, but should show all items for admins

## Implementation Pattern

### For Data Components

```typescript
import { useAuth } from '@/lib/hooks/useAuth'
import { useBranchChangeListener } from '@/lib/hooks/useBranchChangeListener'

export default function MyComponent() {
  const { organizationId, branchId } = useAuth()

  const fetchData = useCallback(async () => {
    let query = supabase.from('table_name').select('*')

    // Filter by organization
    if (organizationId) {
      query = query.eq('organization_id', organizationId)
    }

    // Filter by branch (strict filtering - only this branch)
    if (branchId !== undefined && branchId !== null) {
      query = query.eq('branch_id', branchId)
    } else if (branchId === null) {
      // For organizations without branches yet
      query = query.is('branch_id', null)
    }

    const { data } = await query
    // ... handle data
  }, [organizationId, branchId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Listen for branch changes
  useBranchChangeListener(() => {
    fetchData()
  })

  // ... rest of component
}
```

### For Management Components

```typescript
import { useAuth } from '@/lib/hooks/useAuth'

export default function ManagementComponent() {
  const { organizationId, isAdmin } = useAuth()

  const fetchData = useCallback(async () => {
    let query = supabase.from('table_name').select('*')

    // Filter by organization only (NO branch filter for management)
    if (organizationId) {
      query = query.eq('organization_id', organizationId)
    }

    // Do NOT filter by branch_id - show all data

    const { data } = await query
    // ... handle data
  }, [organizationId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // ... rest of component
}
```

## API Routes

Most API routes already accept `branch_id` parameter. Ensure they:

1. Use the provided `branch_id` if given
2. Fall back to user's profile `branch_id` if not provided
3. For tenant admins without `branch_id`, return all branches' data (or null)

## Testing Checklist

For each component:

- [ ] Data filters by branch when branch is selected
- [ ] Data shows all branches when "All Branches" is selected (for admins)
- [ ] Data refetches when branch changes (via branchChanged event)
- [ ] Management components show all data regardless of branch
- [ ] Branch managers/staff see only their branch's data

## Notes

- **NULL branch_id handling**: Some legacy data may have `branch_id = NULL`. Components should handle this appropriately:
  - For strict filtering: Only show records with matching branch_id
  - For fallback: Include NULL branch_id records when no branch-specific records exist

- **ItemManagement**: Currently filters by branch, but admins managing items should see all items. Consider:
  - Show all items for admins
  - Filter by branch for branch managers/staff
  - Allow admins to assign items to branches
